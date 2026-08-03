// Authoritative Class X board syllabi (2026-27) for the app's board trees.
//
// Sources: official SCERT AP / BSEAP and TS SCERT / BSE Telangana listings
// (cross-checked; see AGENTS.md). `ncert` = the NCERT chapter id to borrow
// resolved topics from for learning (null = template topics are generated).
// No copyrighted textbook content — chapter titles only.
'use strict';

const N = {
  'Real Numbers': 'real-numbers',
  'Polynomials': 'polynomials',
  'Pair of Linear Equations in Two Variables': 'pair-of-linear-equations',
  'Quadratic Equations': 'quadratic-equations',
  'Arithmetic Progressions': 'arithmetic-progressions',
  'Triangles': 'triangles',
  'Coordinate Geometry': 'coordinate-geometry',
  'Introduction to Trigonometry': 'introduction-to-trigonometry',
  'Some Applications of Trigonometry': 'applications-of-trigonometry',
  'Circles': 'circles',
  'Areas Related to Circles': 'areas-related-to-circles',
  'Surface Areas and Volumes': 'surface-areas-and-volumes',
  'Statistics': 'statistics',
  'Probability': 'probability',
  'Light – Reflection and Refraction': 'light-reflection-refraction',
  'Light - Reflection and Refraction': 'light-reflection-refraction',
  'The Human Eye and the Colourful World': 'human-eye-and-colourful-world',
  'Human Eye and Colourful World': 'human-eye-and-colourful-world',
  'Electricity': 'electricity',
  'Electric Current': 'electricity',
  'Magnetic Effects of Electric Current': 'magnetic-effects-of-electric-current',
  'Chemical Reactions and Equations': 'chemical-reactions-equations',
  'Chemical Equations': 'chemical-reactions-equations',
  'Acids, Bases and Salts': 'acids-bases-salts',
  'Acids, Bases and Salts': 'acids-bases-salts',
  'Metals and Non-metals': 'metals-and-non-metals',
  'Carbon and its Compounds': 'carbon-and-its-compounds',
  'Carbon and Its Compounds': 'carbon-and-its-compounds',
  'Life Processes': 'life-processes',
  'Control and Coordination': 'control-and-coordination',
  'Reproduction': 'how-do-organisms-reproduce',
  'Heredity': 'heredity-and-evolution',
  'Our Environment': 'natural-resources',
  'Nationalism in India': 'nationalism-in-india',
  'Resources and Development': 'resources-and-development',
  'Power Sharing': 'power-sharing',
  'Sectors of the Indian Economy': 'sectors-of-indian-economy',
  'Progressions': 'arithmetic-progressions',
  'Similar Triangles': 'triangles',
  'Tangents and Secants to a Circle': 'circles',
  'Trigonometry': 'introduction-to-trigonometry',
  'Mensuration': 'surface-areas-and-volumes',
  'Reflection of Light at Curved Surfaces': 'light-reflection-refraction',
  'Refraction of Light at Curved Surfaces': 'light-reflection-refraction',
  'Electromagnetism': 'magnetic-effects-of-electric-current',
  'Structure of Atom': 'periodic-classification-elements',
  'Classification of Elements - The Periodic Table': 'periodic-classification-elements',
  'Principles of Metallurgy': 'metals-and-non-metals',
  'Nutrition - Food Supplying System': 'life-processes',
  'Respiration - The Energy Releasing System': 'life-processes',
  'Transportation - The Circulatory System': 'life-processes',
  'Excretion - The Wastes Forming System': 'life-processes',
  'Coordination - The Linking System': 'control-and-coordination',
  'Reproduction - The Generating System': 'how-do-organisms-reproduce',
  'Coordination in Life Processes': 'control-and-coordination',
  'Heredity - From Parents to Progeny': 'heredity-and-evolution',
  'Natural Resources': 'natural-resources'
};

const AP = {
  mathematics: ['Real Numbers', 'Polynomials', 'Pair of Linear Equations in Two Variables', 'Quadratic Equations', 'Arithmetic Progressions', 'Triangles', 'Coordinate Geometry', 'Introduction to Trigonometry', 'Some Applications of Trigonometry', 'Circles', 'Areas Related to Circles', 'Surface Areas and Volumes', 'Statistics', 'Probability'],
  physics: ['Light - Reflection and Refraction', 'The Human Eye and the Colourful World', 'Electricity', 'Magnetic Effects of Electric Current'],
  chemistry: ['Chemical Reactions and Equations', 'Acids, Bases and Salts', 'Metals and Non-metals', 'Carbon and its Compounds'],
  biology: ['Life Processes', 'Control and Coordination', 'Reproduction', 'Heredity', 'Our Environment'],
  history: ['The Rise of Nationalism in Europe', 'Nationalism in India', 'The Making of the Global World', 'The Age of Industrialisation', 'Print Culture and the Modern World'],
  geography: ['Resources and Development', 'Forest and Wildlife Resources', 'Water Resources', 'Agriculture', 'Minerals and Energy Resources', 'Manufacturing Industries', 'Lifelines of National Economy'],
  civics: ['Power Sharing', 'Federalism', 'Gender, Religion and Caste', 'Political Parties', 'Outcomes of Democracy'],
  economics: ['Development', 'Sectors of the Indian Economy', 'Money and Credit', 'Globalisation and the Indian Economy', 'Consumer Rights']
};

const TS = {
  mathematics: ['Real Numbers', 'Sets', 'Polynomials', 'Pair of Linear Equations in Two Variables', 'Quadratic Equations', 'Progressions', 'Coordinate Geometry', 'Similar Triangles', 'Tangents and Secants to a Circle', 'Mensuration', 'Trigonometry', 'Applications of Trigonometry', 'Probability', 'Statistics'],
  physics: ['Reflection of Light at Curved Surfaces', 'Refraction of Light at Curved Surfaces', 'Human Eye and Colourful World', 'Electric Current', 'Electromagnetism'],
  chemistry: ['Chemical Equations', 'Acids, Bases and Salts', 'Structure of Atom', 'Classification of Elements - The Periodic Table', 'Chemical Bonding', 'Principles of Metallurgy', 'Carbon and its Compounds'],
  biology: ['Nutrition - Food Supplying System', 'Respiration - The Energy Releasing System', 'Transportation - The Circulatory System', 'Excretion - The Wastes Forming System', 'Coordination - The Linking System', 'Reproduction - The Generating System', 'Coordination in Life Processes', 'Heredity - From Parents to Progeny', 'Our Environment', 'Natural Resources'],
  history: ['National Liberation Movements in the Colonies', 'The World Between Wars 1900 to 1950', 'National Movements in India', 'First 30 Years of Independent India', 'Post-War World and India', 'The Movement for the Formation of Telangana'],
  geography: ['India: Relief Features', 'Indian Rivers, Lakes and Water Resources', 'Climate of India', 'Population and Migration', 'Settlements and their Types'],
  civics: ['Election Process in India', 'Making of Independent India\u0027s Constitution', 'Federalism and Political Trends (1977 to 1990)', 'Social Movements in Our Times'],
  economics: ['Production and Employment', 'Ideas of Development', 'Rampur: A Village Economy', 'Globalisation', 'Sustainable Development with Equity', 'Food Security']
};

const BOARDS = { AP_BOARD: AP, TS_BOARD: TS };

function flatten(board) {
  const out = [];
  for (const [subject, chapters] of Object.entries(board)) {
    for (const name of chapters) {
      out.push({ subject, name, ncert: N[name] || null });
    }
  }
  return out;
}

module.exports = { BOARDS, flatten, NCERT_MAP: N };