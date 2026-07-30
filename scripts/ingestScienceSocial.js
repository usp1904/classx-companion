const fs = require('fs');
const path = require('path');
const { db, initDatabase } = require('../lib/database');

console.log('Ingesting Science and Social Sciences syllabus...');
initDatabase();

// 1. Prepare inserts
const insertSubject = db.prepare('INSERT OR REPLACE INTO subjects (id, name, description) VALUES (?, ?, ?)');
const insertChapter = db.prepare('INSERT OR REPLACE INTO chapters (id, subject_id, name, summary, board_source, academic_year) VALUES (?, ?, ?, ?, ?, ?)');
const insertTopic = db.prepare('INSERT OR REPLACE INTO topics (id, chapter_id, name, description, document_tree_path) VALUES (?, ?, ?, ?, ?)');
const insertConceptNode = db.prepare('INSERT OR REPLACE INTO concept_nodes (id, name, description, formulas) VALUES (?, ?, ?, ?)');
const insertConceptEdge = db.prepare('INSERT OR REPLACE INTO concept_edges (id, source_concept_id, target_concept_id, relation_type) VALUES (?, ?, ?, ?)');
const insertProblem = db.prepare('INSERT OR REPLACE INTO problems (id, topic_id, book_source, exercise_label, question_number, question_text, question_latex, difficulty, concept_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
const insertSolution = db.prepare('INSERT OR REPLACE INTO solutions (id, problem_id, step_number, step_explanation, step_latex, formula_used, vedic_shortcut_applied) VALUES (?, ?, ?, ?, ?, ?, ?)');

// 2. Ingest Subjects
insertSubject.run('physics', 'Physics', 'NCERT Class X Physics covering light, electricity, magnetism, and energy resources.');
insertSubject.run('chemistry', 'Chemistry', 'NCERT Class X chemistry covering reactions, acids, bases, metals, and carbon compounds.');
insertSubject.run('biology', 'Biology', 'NCERT Class X biology covering life processes, reproduction, heredity, and environment.');
insertSubject.run('social-studies', 'Social Studies', 'NCERT Class X Social Sciences covering History, Civics, Geography, and Economics.');

// 3. Load syllabus.json for Science
const syllabusPath = path.join(__dirname, '..', 'data', 'syllabus.json');
if (fs.existsSync(syllabusPath)) {
  const data = JSON.parse(fs.readFileSync(syllabusPath, 'utf8'));
  data.subjects.forEach(subj => {
    if (['physics', 'chemistry', 'biology'].includes(subj.id)) {
      console.log(`Ingesting Science Subject: ${subj.name}...`);
      subj.chapters.forEach(ch => {
        // Chapter
        insertChapter.run(ch.id, subj.id, ch.name, ch.summary, 'CBSE_NCERT', '2026-27');
        
        // Topics
        if (ch.topics) {
          ch.topics.forEach((t, idx) => {
            const topicId = `${ch.id}-topic-${idx}`;
            insertTopic.run(topicId, ch.id, t, `Syllabus topic: ${t}`, `${subj.name} > ${ch.name} > ${t}`);
            
            // Concept Node
            const conceptId = `${ch.id}-concept-${idx}`;
            insertConceptNode.run(conceptId, t, `Everyday analogy: Understanding ${t} in our daily routine.`, '{}');
            insertConceptEdge.run(`edge-${ch.id}-${idx}`, `${ch.id}-concept-0`, conceptId, 'RELATED_TO');
          });
        }

        // Exercises as solved problems
        if (ch.exercises) {
          ch.exercises.forEach((ex, exIdx) => {
            const topicId = `${ch.id}-topic-0`; // map to first topic
            const problemId = `p-${ch.id}-${exIdx}`;
            
            insertProblem.run(
              problemId,
              topicId,
              'NCERT',
              'Exercise Solved',
              exIdx + 1,
              ex.question,
              ex.question,
              'MEDIUM',
              `${ch.id}-concept-0`
            );

            // Solution Step
            insertSolution.run(
              `${problemId}-step-0`,
              problemId,
              1,
              ex.solution,
              ex.solution,
              '[]',
              'None'
            );
          });
        }
      });
    }
  });
}

// 4. Ingest Social Studies chapters (History, Civics, Geography, Economics)
console.log('Seeding Social Studies chapters...');
const socialChapters = [
  {
    id: 'nationalism-in-india',
    name: 'Nationalism in India',
    summary: 'The First World War, Khilafat and Non-Cooperation, and Civil Disobedience movements.',
    topics: ['Non-Cooperation Movement', 'Salt March', 'Sense of Collective Belonging'],
    problems: [
      {
        question: 'Why did Mahatma Gandhi decide to withdraw the Non-Cooperation Movement?',
        solution: 'In February 1922, Mahatma Gandhi decided to withdraw the Non-Cooperation Movement because: (1) The movement was turning violent in many places, notably the Chauri Chaura incident where a peaceful demonstration turned into a violent clash with police, resulting in the burning of a police station. (2) Gandhiji felt that the satyagrahis needed to be properly trained before they would be ready for mass struggles.'
      }
    ]
  },
  {
    id: 'resources-and-development',
    name: 'Resources and Development',
    summary: 'Types of resources, planning, conservation, land resources, and soil classification.',
    topics: ['Classification of Resources', 'Resource Planning', 'Soil Conservation'],
    problems: [
      {
        question: 'Define sustainable development. Why is it important?',
        solution: 'Sustainable development means development should take place without damaging the environment, and development in the present should not compromise the needs of future generations. It is important to ensure resource availability for future cohorts and prevent ecological degradation like global warming or soil depletion.'
      }
    ]
  },
  {
    id: 'power-sharing',
    name: 'Power Sharing',
    summary: 'Belgian and Sri Lankan case studies, necessity of power sharing, and forms of power sharing.',
    topics: ['Case Study of Belgium', 'Majoritarianism in Sri Lanka', 'Forms of Power Sharing'],
    problems: [
      {
        question: 'What are the different forms of power sharing in modern democracies?',
        solution: 'Power sharing takes four main forms: (1) Horizontal distribution among different organs of government (Legislature, Executive, Judiciary). (2) Vertical distribution among governments at different levels (Federal/Central and State/Provincial). (3) Sharing among different social groups (linguistic or religious groups, e.g., Community Government in Belgium). (4) Sharing among political parties, pressure groups, and movements.'
      }
    ]
  },
  {
    id: 'sectors-of-indian-economy',
    name: 'Sectors of the Indian Economy',
    summary: 'Primary, secondary, and tertiary sectors; comparing sectors; organized and unorganized sectors.',
    topics: ['Primary, Secondary and Tertiary Sectors', 'Organized vs Unorganized Sector', 'GDP Contribution'],
    problems: [
      {
        question: 'Explain the difference between organized and unorganized sectors.',
        solution: 'Organized Sector covers enterprises where terms of employment are regular and people have assured work, governed by government acts (Factories Act, Minimum Wages Act). Unorganized Sector consists of small and scattered units largely outside government control, characterized by low-paid and irregular jobs with no social security benefits.'
      }
    ]
  }
];

socialChapters.forEach(ch => {
  insertChapter.run(ch.id, 'social-studies', ch.name, ch.summary, 'CBSE_NCERT', '2026-27');
  
  ch.topics.forEach((t, idx) => {
    const topicId = `${ch.id}-topic-${idx}`;
    insertTopic.run(topicId, ch.id, t, `Syllabus topic: ${t}`, `Social Studies > ${ch.name} > ${t}`);
    
    const conceptId = `${ch.id}-concept-${idx}`;
    insertConceptNode.run(conceptId, t, `Everyday analogy: Understanding ${t} in daily society.`, '{}');
    insertConceptEdge.run(`edge-${ch.id}-${idx}`, `${ch.id}-concept-0`, conceptId, 'RELATED_TO');
  });

  ch.problems.forEach((p, pIdx) => {
    const topicId = `${ch.id}-topic-0`;
    const problemId = `p-${ch.id}-${pIdx}`;
    
    insertProblem.run(
      problemId,
      topicId,
      'NCERT',
      'Chapter Questions',
      pIdx + 1,
      p.question,
      p.question,
      'MEDIUM',
      `${ch.id}-concept-0`
    );

    insertSolution.run(
      `${problemId}-step-0`,
      problemId,
      1,
      p.solution,
      p.solution,
      '[]',
      'None'
    );
  });
});

console.log('Science and Social syllabus ingested successfully!');
db.close();
