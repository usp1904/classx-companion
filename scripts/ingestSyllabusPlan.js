const fs = require('fs');
const path = require('path');
const { db, initDatabase } = require('../lib/database');

console.log('Starting Auto-Ingestion of NCERT 2026-27 & RD Sharma/RS Aggarwal Syllabus Plan...');
initDatabase();

const planPath = path.join(__dirname, '..', 'data', 'study-plan-ncert-2026-27.json');
if (!fs.existsSync(planPath)) {
  console.error('Study plan file not found:', planPath);
  process.exit(1);
}

let plan;
try {
  plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
} catch (err) {
  console.error('Failed to parse study plan:', err.message);
  process.exit(1);
}

// Prepare inserts
const insertChapter = db.prepare('INSERT OR REPLACE INTO chapters (id, subject_id, name, summary, board_source, academic_year) VALUES (?, ?, ?, ?, ?, ?)');
const insertTopic = db.prepare('INSERT OR REPLACE INTO topics (id, chapter_id, name, description, document_tree_path) VALUES (?, ?, ?, ?, ?)');
const insertConceptNode = db.prepare('INSERT OR REPLACE INTO concept_nodes (id, name, description, formulas) VALUES (?, ?, ?, ?)');
const insertConceptEdge = db.prepare('INSERT OR REPLACE INTO concept_edges (id, source_concept_id, target_concept_id, relation_type) VALUES (?, ?, ?, ?)');
const insertProblem = db.prepare('INSERT OR REPLACE INTO problems (id, topic_id, book_source, exercise_label, question_number, question_text, question_latex, difficulty, concept_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
const insertSolution = db.prepare('INSERT OR REPLACE INTO solutions (id, problem_id, step_number, step_explanation, step_latex, formula_used, vedic_shortcut_applied) VALUES (?, ?, ?, ?, ?, ?, ?)');

if (plan.subjects && plan.subjects.length > 0) {
  const math = plan.subjects[0]; // Mathematics subject
  
  math.chapters.forEach(ch => {
    console.log(`Ingesting Chapter: ${ch.name}...`);
    
    // 1. Insert Chapter
    insertChapter.run(ch.id, 'mathematics', ch.name, ch.summary, 'CBSE_NCERT', '2026-27');
    
    // 2. Ingest NCERT Topics
    if (ch.ncertTopics) {
      ch.ncertTopics.forEach((topicName, idx) => {
        const topicId = `${ch.id}-ncert-topic-${idx}`;
        insertTopic.run(
          topicId,
          ch.id,
          topicName,
          `NCERT syllabus topic: ${topicName}`,
          `Mathematics > ${ch.name} > NCERT > ${topicName}`
        );
      });
    }

    // 3. Ingest RD Sharma Extensions & Must Do Exercises
    if (ch.rdSharma) {
      if (ch.rdSharma.extensionTopics) {
        ch.rdSharma.extensionTopics.forEach((topicName, idx) => {
          const topicId = `${ch.id}-rd-ext-${idx}`;
          insertTopic.run(
            topicId,
            ch.id,
            `RD Sharma: ${topicName}`,
            `Advanced extension topic from RD Sharma Class X.`,
            `Mathematics > ${ch.name} > RD Sharma Extensions > ${topicName}`
          );

          // Auto-create a matching Concept Node with everyday analogy
          const conceptId = `${ch.id}-rd-concept-${idx}`;
          insertConceptNode.run(
            conceptId,
            topicName,
            `Everyday Analogy: Think of scaling a simple cooking recipe (like making 3 cups of tea vs 6 cups). It represents proportional changes and operations.`,
            JSON.stringify({ "operation": "Proportional scaling" })
          );
          insertConceptEdge.run(`edge-rd-${ch.id}-${idx}`, `${ch.id}-rd-concept-${idx}`, conceptId, 'EXTENSION_OF');
        });
      }

      if (ch.rdSharma.mustDoExercises) {
        ch.rdSharma.mustDoExercises.forEach((exName, idx) => {
          const topicId = `${ch.id}-rd-ex-${idx}`;
          insertTopic.run(
            topicId,
            ch.id,
            `RD Sharma ${exName}`,
            `Exercise practice from RD Sharma.`,
            `Mathematics > ${ch.name} > RD Sharma Practice > ${exName}`
          );
        });
      }
    }

    // 4. Ingest RS Aggarwal Extensions & Must Do Exercises
    if (ch.rsAggarwal) {
      if (ch.rsAggarwal.extensionTopics) {
        ch.rsAggarwal.extensionTopics.forEach((topicName, idx) => {
          const topicId = `${ch.id}-rs-ext-${idx}`;
          insertTopic.run(
            topicId,
            ch.id,
            `RS Aggarwal: ${topicName}`,
            `Advanced extension topic from RS Aggarwal Class X.`,
            `Mathematics > ${ch.name} > RS Aggarwal Extensions > ${topicName}`
          );
        });
      }

      if (ch.rsAggarwal.mustDoExercises) {
        ch.rsAggarwal.mustDoExercises.forEach((exName, idx) => {
          const topicId = `${ch.id}-rs-ex-${idx}`;
          insertTopic.run(
            topicId,
            ch.id,
            `RS Aggarwal ${exName}`,
            `Exercise practice from RS Aggarwal.`,
            `Mathematics > ${ch.name} > RS Aggarwal Practice > ${exName}`
          );
        });
      }
    }
  });

  // 5. Seed detailed problems & solutions specifically for the missing Real Numbers topics to satisfy the user request!
  console.log('Seeding specific Real Numbers solved problems...');
  
  // Topic: Operations on Surds (Real Numbers)
  const opSurdsTopicId = 'real-numbers-rd-ext-2'; // Mapped from the 3rd extension topic (index 2)
  
  // Problem A: Simplify (3 + √2)(3 - √2)
  insertProblem.run(
    'p-ext-surds-1',
    opSurdsTopicId,
    'RD_SHARMA',
    'Exercise 1.4',
    10,
    'Simplify the expression: (3 + \\sqrt{2})(3 - \\sqrt{2}). Explain its practical utility.',
    '(3 + \\sqrt{2})(3 - \\sqrt{2})',
    'MEDIUM',
    'real-numbers-rd-concept-2'
  );
  insertSolution.run('s-ext-surds-1-s1', 'p-ext-surds-1', 1,
    'Identify the form of the expression. It matches the identity (a + b)(a - b) = a^2 - b^2.',
    '(a + b)(a - b) = a^2 - b^2', '(a+b)(a-b) = a^2-b^2', 'None');
  insertSolution.run('s-ext-surds-1-s2', 'p-ext-surds-1', 2,
    'Substitute a = 3 and b = √2 into the formula.',
    '(3)^2 - (\\sqrt{2})^2', 'None', 'None');
  insertSolution.run('s-ext-surds-1-s3', 'p-ext-surds-1', 3,
    'Evaluate the squares: 3^2 = 9, and (√2)^2 = 2.',
    '9 - 2 = 7', 'None', 'None');
  insertSolution.run('s-ext-surds-1-s4', 'p-ext-surds-1', 4,
    'Everyday Analogy: Think of buying a square carpet of side 3 meters, and cutting off a smaller square section of side √2 meters. The remaining area is exactly 7 square meters.',
    '\\text{Remaining Area} = 7', 'None', 'None');

  // Problem B: Simplify (√5 + √2)^2
  insertProblem.run(
    'p-ext-surds-2',
    opSurdsTopicId,
    'RS_AGARWAL',
    'Exercise 1.5',
    14,
    'Simplify the expression: (\\sqrt{5} + \\sqrt{2})^2.',
    '(\\sqrt{5} + \\sqrt{2})^2',
    'MEDIUM',
    'real-numbers-rd-concept-2'
  );
  insertSolution.run('s-ext-surds-2-s1', 'p-ext-surds-2', 1,
    'Apply the algebraic expansion identity (a + b)^2 = a^2 + 2ab + b^2.',
    '(a + b)^2 = a^2 + 2ab + b^2', '(a+b)^2 = a^2+2ab+b^2', 'None');
  insertSolution.run('s-ext-surds-2-s2', 'p-ext-surds-2', 2,
    'Substitute a = √5 and b = √2.',
    '(\\sqrt{5})^2 + 2(\\sqrt{5})(\\sqrt{2}) + (\\sqrt{2})^2', 'None', 'None');
  insertSolution.run('s-ext-surds-2-s3', 'p-ext-surds-2', 3,
    'Simplify the terms: (√5)^2 = 5, (√2)^2 = 2, and 2(√5)(√2) = 2√10.',
    '5 + 2\\sqrt{10} + 2 = 7 + 2\\sqrt{10}', 'None', 'None');
}

console.log('Ingestion completed successfully!');
db.close();
