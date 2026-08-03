// Enrich every lesson concept with real-life day-to-day examples, industry /
// engineering future value, and curated YouTube Shorts (from content/videos.json).
//
// Idempotent: fills only MISSING fields, never overwrites authored content.
// Converts string concepts (legacy Format B) into rich objects.
//
// Template engine: per-subject keyword map -> specific templates; any concept
// without a keyword match gets a subject-level generic template (never empty).
//
// Run: node scripts/enrichLessons.js
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../content');
const VIDEOS = JSON.parse(fs.readFileSync(path.join(ROOT, 'videos.json'), 'utf8')).videos || {};

const industryMap = {
  physics: ['Aerospace & Satellites', 'Optics / LASIK & Lenses', 'Electrical & Power Grids', 'Robotics & EVs'],
  chemistry: ['Pharma & Drug Design', 'Petrochemicals & Refining', 'Batteries & Energy Storage', 'Agri-Chemicals & Fertilizers'],
  biology: ['Medicine & Surgery', 'Biotech & Genetic Engineering', 'Public Health & Epidemiology', 'Agriculture & Food Tech'],
  mathematics: ['AI & Data Science', 'Finance & Quant Trading', 'Civil & Structural Engineering', 'Space Navigation & Cryptography'],
  history: ['Governance & Diplomacy', 'Law & Public Policy', 'Media & Journalism', 'Civic Leadership'],
  geography: ['Urban Planning & GIS', 'Meteorology & Climate Tech', 'Disaster Management', 'Natural Resource Policy'],
  civics: ['Public Administration', 'Constitutional Law', 'Election & Campaign Tech', 'NGO & Policy Research'],
  economics: ['Banking & Fintech', 'Macro Policy & RBI', 'Startup Economics & Markets', 'Data-Driven Business Analytics']
};
const careerMap = {
  physics: ['Engineer (Space/Mech/Electrical)', 'Data Scientist', 'Medical Physicist', 'Defence Scientist'],
  chemistry: ['Pharmacist / Drug Researcher', 'Chemical Engineer', 'Materials Scientist', 'Environmental Chemist'],
  biology: ['Doctor (MBBS/MD)', 'Biotech Engineer', 'Clinical Researcher', 'Microbiologist'],
  mathematics: ['AI/ML Engineer', 'Actuary & Quantitative Analyst', 'Data Scientist', 'Aerospace Mathematician'],
  history: ['UPSC / Civil Services', 'Historian & Archivist', 'Diplomat', 'Journalist'],
  geography: ['GIS Specialist', 'Meteorologist', 'Urban Planner', 'Climate Scientist'],
  civics: ['Lawyer / Judge', 'Policy Analyst', 'IAS Officer', 'Human Rights Researcher'],
  economics: ['Economist (RBI/World Bank)', 'Investment Banker', 'Data Analyst', 'Entrepreneur']
};
// Subject-level fallback so EVERY concept carries industry value, even without a keyword match.
const subjectIndustryFallback = {
  physics: 'Every smartphone, vehicle and power grid is a physics machine — this concept underpins engineering in aerospace, electronics, optics and energy.',
  chemistry: 'From medicines to batteries to food, chemistry builds every material industry — this concept is core to pharma, energy and manufacturing.',
  biology: 'From hospitals to biotech labs to agriculture, life science runs on these principles — this concept is the foundation of medicine and bio-industry.',
  mathematics: 'Math is the engine of AI, finance, engineering and space — this concept is used daily by data scientists and engineers.',
  history: 'Understanding how societies and nations evolved shapes policy, law and diplomacy — this concept informs governance and civic careers.',
  geography: 'From GIS mapping to climate science to disaster response — this concept powers environmental and urban-planning industries.',
  civics: 'Constitutional and democratic knowledge drives public administration, law and policy — this concept prepares you for governance careers.',
  economics: 'Markets, banking and policy all run on economics — this concept is the base of fintech, finance and public policy careers.'
};

// Keyword -> {realLife, dayToDay[], industry, future}. Subject-keyed.
const keywordTemplates = {
  physics: {
    'reflection': {
      realLife: 'A flat wall mirror flips your image because each light ray obeys the equal-angles rule — the same law engineers use to build car rear-view and make-up mirrors.',
      dayToDay: ['Looking into any flat mirror while grooming', 'CCTV mirrors at ATM corners and blind turns', 'Reflective road studs (cat-eyes) at night'],
      industry: 'Periscopes in submarines, laser alignment in metro tunnels, retro-reflectors on road signs.',
      future: 'Optical engineers design mirrors for telescopes, solar concentrators and self-driving LiDAR.'
    },
    'refraction': {
      realLife: 'A straw in a glass of water looks bent and a swimming pool looks shallower — light changes speed when it crosses air into water.',
      dayToDay: ['Bent straw in a cold-drink glass', 'Pool appearing shallower than it is', 'Rainbow after rain (light bends in raindrops)'],
      industry: 'Camera lenses, spectacles and contact lenses, optical fibres.',
      future: 'Every phone camera and optical fibre network you use runs on refraction — lens designers are in demand across consumer electronics and telecom.'
    },
    'ohm': {
      realLife: 'A 40 W bulb glows dimmer on a long extension wire because the wire\'s resistance limits current — exactly V = IR at work.',
      dayToDay: ['Bulb brightness on long vs short wires', 'Why heaters use thick coils', 'Fuse blowing when too many appliances run on one plug'],
      industry: 'Electrical wiring, power transmission, circuit design in every gadget.',
      future: 'EV battery packs and smart grids are sized using Ohm\'s law; electrical engineers apply it daily.'
    },
    'magnetic': {
      realLife: 'The electromagnetic in your doorbell, school bell and refrigerator magnets all trace back to current flowing in a coil.',
      dayToDay: ['Doorbell ring', 'Refrigerator magnet', 'Loudspeaker cone vibration'],
      industry: 'Electric motors, generators, transformers, MRI machines.',
      future: 'Every electric motor in fans, EVs and factory robots is electromagnetic engineering in action.'
    },
    'electricity': {
      realLife: 'Switching on a fan closes a circuit; the wall socket delivers current because a potential difference exists between the two holes.',
      dayToDay: ['Switching lights on/off', 'Charging a phone', 'Paying an electricity bill based on kWh'],
      industry: 'Power generation, transmission grids, consumer electronics.',
      future: 'Grid-scale solar, EV charging networks and smart homes are built on circuit fundamentals.'
    },
    'human eye': {
      realLife: 'When you squint to read a distant board, your eye\'s lens is doing the same job a camera lens does — focusing light onto a screen.',
      dayToDay: ['Squinting at a whiteboard', 'Eyes adjusting when entering a dark theatre', 'Wearing spectacles to correct myopia'],
      industry: 'Optometry, LASIK surgery, camera and AR/VR optics.',
      future: 'Optometrists and AR/VR lens engineers model the eye as an optical system exactly like this chapter.'
    },
    'energy': {
      realLife: 'Solar panels on rooftops convert light into electricity — the same photoelectric effect that powers calculators and satellites.',
      dayToDay: ['Solar garden lights', 'EV charging from rooftop panels', 'Biogas plant in a village'],
      industry: 'Renewable energy, solar manufacturing, battery storage.',
      future: 'India\'s solar mission needs energy engineers — this chapter is their starting line.'
    }
  },
  chemistry: {
    'chemical reaction': {
      realLife: 'Rust on a bicycle, milk turning into curd, and bread puffing up with yeast are all chemical reactions happening around you.',
      dayToDay: ['Rusting of iron gates and cycles', 'Curd formation from milk', 'Burning LPG gas to cook food'],
      industry: 'Pharmaceutical synthesis, fertiliser plants, cement kilns.',
      future: 'Every medicine molecule is made via a balanced chemical reaction — drug and materials chemists build careers here.'
    },
    'acid': {
      realLife: 'Antacids neutralise the excess acid in your stomach — a real-life example of the acid–base neutralisation reaction.',
      dayToDay: ['Taking an antacid for acidity', 'Lemon juice and baking soda fizzing', 'Applying vinegar to clean mineral stains'],
      industry: 'pH control in water treatment, battery electrolytes, food preservation.',
      future: 'Chemists control pH in everything from shampoo to pharmaceutical syrups.'
    },
    'metal': {
      realLife: 'The aluminium foil you wrap food in and the iron in your school grill both behave differently with air and water — that is the reactivity series.',
      dayToDay: ['Aluminium foil for wrapping', 'Iron nails rusting', 'Gold jewellery not tarnishing'],
      industry: 'Metallurgy, corrosion protection, alloy design.',
      future: 'Aerospace and EV bodies rely on reactive metals handled safely — metallurgy engineers are core to these industries.'
    },
    'carbon': {
      realLife: 'Petrol, LPG, plastic bottles and even you are made of carbon chains — this chapter explains why carbon forms so many compounds.',
      dayToDay: ['LPG cooking gas', 'Plastic water bottles', 'Petrol in vehicles'],
      industry: 'Petrochemicals, polymers/plastics, biofuels, pharmaceuticals.',
      future: 'Green chemistry and plastic recycling industries need carbon-chemists for a sustainable India.'
    }
  },
  biology: {
    'nutrition': {
      realLife: 'The chapati you eat is broken down into glucose, fats and proteins that power your brain and muscles — autotrophs like plants make it, heterotrophs like you consume it.',
      dayToDay: ['Eating breakfast to fuel the school day', 'Plants making food in sunlight', 'Why you feel sleepy after a heavy meal'],
      industry: 'Food technology, sports nutrition, agriculture.',
      future: 'Dietitians and food-tech companies design meals based on exactly this nutrition science.'
    },
    'life process': {
      realLife: 'Breathing hard after a race is your respiratory system paying back the oxygen debt — respiration releasing energy from glucose.',
      dayToDay: ['Heavy breathing after running', 'Why you exhale faster when scared', 'Muscle cramps from lactic acid'],
      industry: 'Sports science, medicine, exercise physiology.',
      future: 'Sports scientists and exercise physiologists track these processes to train athletes.'
    },
    'coordination': {
      realLife: 'Pulling your hand away from a hot vessel before you even think is a reflex arc — your spinal cord coordinating without the brain.',
      dayToDay: ['Pulling hand back from a hot pan', 'Knee-jerk in a doctor\'s test', 'Dilating pupils in the dark'],
      industry: 'Neuroscience, prosthetics, robotics.',
      future: 'Neural engineering and smart prosthetics mimic these coordination pathways.'
    },
    'reproduction': {
      realLife: 'A seed sprouting in a pot and a mango tree flowering — both are reproduction strategies ensuring the species continues.',
      dayToDay: ['Planting seeds in a garden', 'Layering in rose plants', 'Budding in yeast used in bakery'],
      industry: 'Agriculture, IVF and fertility clinics, plant biotechnology.',
      future: 'Agricultural scientists breed better crops using these same principles.'
    },
    'heredity': {
      realLife: 'Your eye colour, height and even the way some families pass on traits follow Mendel\'s laws — heredity in action.',
      dayToDay: ['Family resemblance in eye/hair colour', 'Pea-plant traits in a kitchen garden', 'Blood group inheritance'],
      industry: 'Genetic testing, personalised medicine, forensic DNA.',
      future: 'Genetic counsellors and biotech firms use heredity rules to predict and prevent diseases.'
    }
  },
  mathematics: {
    'real number': {
      realLife: 'Counting money, measuring rice in fractions and measuring a field\'s diagonal (√2) — all numbers you touch daily belong to this family.',
      dayToDay: ['Counting change at a shop', '½ kg or ¼ cup measurements in recipes', 'Measuring a square plot\'s diagonal'],
      industry: 'Cryptography, data compression, computer arithmetic.',
      future: 'Prime numbers (from this chapter) secure every online password and UPI transaction.'
    },
    'polynomial': {
      realLife: 'A ball thrown upward follows a curved path that a quadratic polynomial describes — its height as a function of time.',
      dayToDay: ['Throwing a ball in the air', 'A parabolic water fountain arc', 'Profit curves of a lemonade stall'],
      industry: 'Economics modelling, physics simulation, machine learning.',
      future: 'AI models are built from polynomial maths — data scientists use these every day.'
    },
    'trigonometry': {
      realLife: 'Using tan to find the height of a tree or building from a distance — the same method surveyors and pilots use.',
      dayToDay: ['Finding a flagpole\'s height with a shadow', 'Ramp inclines for wheelchairs', 'Climbing stairs and roof slopes'],
      industry: 'Surveying, civil engineering, navigation, computer graphics.',
      future: 'GPS, game engines and bridge design all run on trigonometry.'
    },
    'coordinate geometry': {
      realLife: 'The location of your school on Google Maps is a pair of coordinates — latitude and longitude — exactly the x and y of this chapter.',
      dayToDay: ['Sharing a Google Maps location pin', 'Plotting marks on a graph sheet', 'Finding midpoints while splitting land'],
      industry: 'GIS, autonomous vehicles, map apps, robotics.',
      future: 'Self-driving cars and drone delivery navigate by coordinate geometry.'
    },
    'statistics': {
      realLife: 'Teachers calculate class averages and cricket commentators show batting averages — all statistics from data you see daily.',
      dayToDay: ['Class test average marks', 'Cricket player averages', 'Weather temperature trends'],
      industry: 'Data science, market research, sports analytics, public policy.',
      future: 'Every data-driven decision in business and government uses statistics.'
    },
    'probability': {
      realLife: 'Weather forecast saying 80% rain, or a bowler\'s chances of taking a wicket — probability predicting the future from patterns.',
      dayToDay: ['Rain probability in the weather app', 'Dice and card games', 'Insurance premium calculations'],
      industry: 'Insurance, finance risk, AI prediction, gaming.',
      future: 'Actuaries and AI engineers model uncertainty — probability is their core tool.'
    },
    'circles': {
      realLife: 'Bicycle wheels, rotis, and the rim of a cup are all circles — tangents explain why a wheel rolling on a road touches it at exactly one point.',
      dayToDay: ['Bicycle wheel touching the road', 'Rolling a chapati', 'A compass-drawn circle'],
      industry: 'Mechanical engineering, wheel design, circular motion machines.',
      future: 'Rotary machinery and gear design use circle and tangent geometry.'
    },
    'triangle': {
      realLife: 'Similar triangles help measure heights you cannot reach — like estimating a tall tree or tower using its shadow.',
      dayToDay: ['Measuring a building\'s height with shadows', 'Matching photo sizes (similar figures)', 'Map scaling'],
      industry: 'Architecture, construction, forensics, image processing.',
      future: 'Computer vision matches similar triangles to recognise faces and objects.'
    }
  }
};

function norm(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function findByKeyword(subject, conceptName) {
  const n = norm(conceptName);
  const map = keywordTemplates[subject] || {};
  let best = null;
  for (const key of Object.keys(map)) {
    if (n.includes(key) || key.split(/\s+/).some(k => n.includes(k))) {
      if (!best || key.length > best.key.length) best = { key, tpl: map[key] };
    }
  }
  return best ? best.tpl : null;
}

function subjectOf(filePath, data) {
  if (data && data.subject) {
    const s = String(data.subject).toLowerCase().trim();
    if (['physics', 'chemistry', 'biology', 'mathematics', 'history', 'geography', 'civics', 'economics'].includes(s)) return s;
  }
  const rel = path.relative(ROOT, filePath).split(path.sep);
  const top = rel[0].toLowerCase();
  if (['physics', 'chemistry', 'biology', 'mathematics'].includes(top)) return top;
  if (rel[1] && ['physics', 'chemistry', 'biology'].includes(rel[1])) return rel[1];
  if (rel[1]) return rel[1].toLowerCase();
  return top;
}

function enrichConcept(subject, c, videos) {
  if (typeof c === 'string') c = { name: c };
  const tpl = findByKeyword(subject, c.name);
  const v = videos[c.name] || videos[subject] || null;
  const base = {
    real_life_application: (tpl ? tpl.realLife : '') || c.real_life_application || subjectIndustryFallback[subject] || '',
    day_to_day_usage: (tpl ? tpl.dayToDay : null) || c.day_to_day_usage || [],
    industry_relevance: (tpl ? tpl.industry : '') || c.industry_relevance || subjectIndustryFallback[subject] || '',
    engineering_domains: (industryMap[subject] || []).join(', '),
    future_careers: (careerMap[subject] || []).join(', ')
  };
  if (v) base.video_embed = 'https://www.youtube.com/embed/' + v + '?autoplay=1&mute=1&playlist=' + v + '&loop=1&controls=0&rel=0&modestbranding=1';
  for (const [k, val] of Object.entries(base)) {
    if (val !== '' && val !== null && (c[k] === undefined || c[k] === '' || c[k] === null)) c[k] = val;
  }
  if (!c.purpose) c.purpose = '';
  return c;
}

function processFile(filePath) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return 0;
  }
  if (!data || typeof data !== 'object') return 0;
  const subject = subjectOf(filePath, data);
  const videos = VIDEOS[subject] || {};
  let n = 0;

  const enrichArr = arr => {
    if (!Array.isArray(arr)) return;
    for (let i = 0; i < arr.length; i++) {
      arr[i] = enrichConcept(subject, arr[i], videos);
      n++;
    }
  };

  if (Array.isArray(data.concepts)) {
    enrichArr(data.concepts);
  } else if (Array.isArray(data.chapters)) {
    for (const ch of data.chapters) {
      if (Array.isArray(ch.concepts)) enrichArr(ch.concepts);
    }
  }
  if (n > 0) fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  return n;
}

function walk(dir) {
  let total = 0;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) total += walk(p);
    else if (f.name.endsWith('.json') && f.name !== 'videos.json') total += processFile(p);
  }
  return total;
}

const enriched = walk(ROOT);
console.log(`Enriched ${enriched} concepts across content/ (idempotent; authored fields preserved).`);
