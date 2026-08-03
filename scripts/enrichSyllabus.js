// Enrich data/syllabus.json with College / NEET-JEE facing chapter metadata.
// Adds per-chapter: jee_neet.weightage (HIGH/MEDIUM/LOW), jee_neet.foundation
// (JEE/NEET prep pointers), jee_neet.relevance (engineering/medical string).
// Idempotent (fills only missing), preserves existing fields. 8-subject
// structure untouched -> syllabus.test.js stays green.
//
// Run: node scripts/enrichSyllabus.js
'use strict';

const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '../data/syllabus.json');
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));

// subjectId -> [ [keyword, {w, rel, foundation[]}], ... ]
const RULES = {
  mathematics: [
    ['real numbers', { w: 'MEDIUM', rel: 'Cryptography, UPI/prime-based security, computer arithmetic.', f: ['Number theory groundwork for IOQM/JEE'] }],
    ['polynomials', { w: 'MEDIUM', rel: 'AI/ML model fitting, econometrics, projectile physics.', f: ['Zero-factor theorem, graphs for calculus'] }],
    ['linear equations', { w: 'MEDIUM', rel: 'Optimization in finance, circuit networks, AI regression.', f: ['Graphical methods -> linear programming'] }],
    ['quadratic equations', { w: 'HIGH', rel: 'Ballistic motion, optimization, projectile design.', f: ['Nature of roots, quadratic graphs feed JEE functions'] }],
    ['arithmetic progressions', { w: 'MEDIUM', rel: 'EMI schedules, population models, time-series.', f: ['Sequences & series base for JEE'] }],
    ['triangles', { w: 'HIGH', rel: 'Similarity in computer vision, construction geometry.', f: ['Similarity -> trigonometry & geometry of JEE'] }],
    ['coordinate geometry', { w: 'MEDIUM', rel: 'GIS, autonomous vehicles, 3D rendering.', f: ['Straight lines/circles feed JEE coordinate geometry'] }],
    ['trigonometry', { w: 'HIGH', rel: 'Wave analysis, satellite orbit, structural engineering.', f: ['Trig identities are core JEE/NEET physics tooling'] }],
    ['areas related to circles', { w: 'MEDIUM', rel: 'Wheel & gear sizing, circular motion design.', f: ['Mensuration base for JEE geometry'] }],
    ['surface areas and volumes', { w: 'MEDIUM', rel: 'Packaging, storage tanks, 3D printing.', f: ['3D mensuration for JEE'] }],
    ['statistics', { w: 'MEDIUM', rel: 'Data science, sports analytics, public policy.', f: ['Mean/variance groundwork for probability'] }],
    ['probability', { w: 'HIGH', rel: 'Insurance, AI prediction, quant finance.', f: ['Probability is a direct JEE unit'] }]
  ],
  physics: [
    ['light', { w: 'HIGH', rel: 'Optics, LASIK, fibre optics, LiDAR, telescope design.', f: ['Ray optics is a core JEE/NEET optics unit'] }],
    ['human eye', { w: 'MEDIUM', rel: 'Optometry, camera & AR/VR optics.', f: ['Defects of vision -> lens combinations in JEE'] }],
    ['electricity', { w: 'HIGH', rel: 'Power grids, EV batteries, circuit design.', f: ['Current electricity is a major JEE/NEET unit'] }],
    ['magnetic effects', { w: 'MEDIUM', rel: 'Electric motors, generators, MRI.', f: ['Magnetism groundwork for JEE electromagnetism'] }]
  ],
  chemistry: [
    ['chemical reactions', { w: 'HIGH', rel: 'Pharma synthesis, cement, battery chemistry.', f: ['Chemical equations underpin physical & organic chemistry'] }],
    ['acid', { w: 'HIGH', rel: 'pH in medicine, water treatment, food.', f: ['Acids-bases equilibrium is a NEET favourite'] }],
    ['metal', { w: 'MEDIUM', rel: 'Metallurgy, alloys, aerospace bodies.', f: ['Metallurgy appears in NEET inorganic chemistry'] }],
    ['carbon', { w: 'HIGH', rel: 'Petrochemicals, polymers, biofuels.', f: ['Carbon compounds are the base of organic chemistry'] }]
  ],
  biology: [
    ['life process', { w: 'HIGH', rel: 'Medicine, sports science, physiology.', f: ['Human physiology is a NEET heavy-weight unit'] }],
    ['control', { w: 'MEDIUM', rel: 'Neuroscience, prosthetics, robotics.', f: ['Neural control is a NEET topic'] }],
    ['reproduction', { w: 'MEDIUM', rel: 'IVF, agriculture, biotechnology.', f: ['Reproduction is a NEET unit'] }],
    ['heredity', { w: 'HIGH', rel: 'Genetics, personalised medicine, forensics.', f: ['Mendelian genetics is a NEET core topic'] }],
    ['nutrition', { w: 'MEDIUM', rel: 'Food tech, sports nutrition, agriculture.', f: ['Nutrition is part of NEET physiology'] }]
  ],
  history: [
    ['nationalism', { w: 'MEDIUM', rel: 'Policy, diplomacy, governance careers.', f: ['Indian National Movement strengthens essay/GS answers'] }]
  ],
  geography: [
    ['resources', { w: 'MEDIUM', rel: 'GIS, climate science, disaster management.', f: ['Resource geography supports UPSC/CLAT prep'] }]
  ],
  civics: [
    ['power sharing', { w: 'MEDIUM', rel: 'Public administration, constitutional law.', f: ['Power-sharing grounds Polity for UPSC/CLAT'] }]
  ],
  economics: [
    ['sectors', { w: 'MEDIUM', rel: 'Banking, public policy, analytics.', f: ['Sectors ground macroeconomics for UPSC'] }]
  ]
};

function match(subjectRules, chName) {
  const n = String(chName).toLowerCase();
  let best = null;
  for (const [kw, meta] of subjectRules) {
    if (n.includes(kw)) { if (!best || kw.length > best.kw.length) best = { kw, meta }; }
  }
  return best ? best.meta : null;
}

const FALLBACK = {
  mathematics: { w: 'MEDIUM', rel: 'Mathematics underpins AI, finance, engineering and space.', f: ['Builds the numerical foundation for JEE/NEET'] },
  physics: { w: 'HIGH', rel: 'Physics runs every device, vehicle and power system.', f: ['Physics is a top-weightage JEE/NEET subject'] },
  chemistry: { w: 'HIGH', rel: 'Chemistry builds pharma, energy and materials industries.', f: ['Chemistry is a high-weightage NEET subject'] },
  biology: { w: 'HIGH', rel: 'Biology drives medicine, biotech and public health.', f: ['Biology is the core of NEET'] },
  history: { w: 'LOW', rel: 'History informs policy, law and diplomacy.', f: ['Supports essay and general studies rounds'] },
  geography: { w: 'LOW', rel: 'Geography powers GIS, climate and urban planning.', f: ['Supports UPSC/CLAT geography'] },
  civics: { w: 'LOW', rel: 'Civics drives public administration and law.', f: ['Supports Polity for competitive exams'] },
  economics: { w: 'MEDIUM', rel: 'Economics runs banking, policy and analytics.', f: ['Supports economics in UPSC/CA tracks'] }
};

let enriched = 0;
for (const subject of data.subjects) {
  const rules = RULES[subject.id] || [];
  const fb = FALLBACK[subject.id];
  if (!fb) continue;
  for (const ch of subject.chapters || []) {
    if (ch.jee_neet) { enriched++; continue; }
    const meta = match(rules, ch.name) || fb;
    ch.jee_neet = {
      weightage: meta.w,
      relevance: meta.rel,
      foundation: meta.f
    };
    enriched++;
  }
}

fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n');
console.log(`Syllabus NEET/JEE-facing enrichment done: ${enriched} chapters tagged.`);
