const fs = require('fs');
const path = require('path');
const { db, initDatabase } = require('../lib/database');

console.log('Running schema initialization...');
initDatabase();

const contentDir = path.join(__dirname, '..', 'content', 'mathematics');
if (!fs.existsSync(contentDir)) {
  console.error('Content directory does not exist:', contentDir);
  process.exit(1);
}

// Prepare inserts
const insertSubject = db.prepare('INSERT OR IGNORE INTO subjects (id, name, description) VALUES (?, ?, ?)');
const insertChapter = db.prepare('INSERT OR REPLACE INTO chapters (id, subject_id, name, summary, board_source, academic_year) VALUES (?, ?, ?, ?, ?, ?)');
const insertTopic = db.prepare('INSERT OR REPLACE INTO topics (id, chapter_id, name, description, document_tree_path) VALUES (?, ?, ?, ?, ?)');
const insertConceptNode = db.prepare('INSERT OR REPLACE INTO concept_nodes (id, name, description, formulas) VALUES (?, ?, ?, ?)');
const insertConceptEdge = db.prepare('INSERT OR REPLACE INTO concept_edges (id, source_concept_id, target_concept_id, relation_type) VALUES (?, ?, ?, ?)');
const insertProblem = db.prepare('INSERT OR REPLACE INTO problems (id, topic_id, book_source, exercise_label, question_number, question_text, question_latex, difficulty, concept_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
const insertSolution = db.prepare('INSERT OR REPLACE INTO solutions (id, problem_id, step_number, step_explanation, step_latex, formula_used, vedic_shortcut_applied) VALUES (?, ?, ?, ?, ?, ?, ?)');
const insertMedia = db.prepare('INSERT OR REPLACE INTO media_attachments (id, target_id, target_type, media_type, title, media_url, thumbnail_url) VALUES (?, ?, ?, ?, ?, ?, ?)');

// Ensure subject exists
insertSubject.run('mathematics', 'Mathematics', 'Class X Mathematics NCERT and State Boards');

const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.json'));
console.log(`Found ${files.length} lesson files to import.`);

// Keep track of concepts to build a knowledge graph
const allConceptIds = [];

files.forEach(file => {
  const filePath = path.join(contentDir, file);
  console.log(`Importing: ${file}...`);
  
  let lesson;
  try {
    lesson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`Failed to parse ${file}:`, err.message);
    return;
  }

  const chapterId = lesson.id || path.basename(file, '.json');
  const chapterName = lesson.chapter || chapterId;
  const summary = lesson.title || '';

  // 1. Chapter
  insertChapter.run(chapterId, 'mathematics', chapterName, summary, 'CBSE_NCERT', '2026-27');

  // 2. Concepts & Concept Nodes
  if (Array.isArray(lesson.concepts)) {
    lesson.concepts.forEach((c, idx) => {
      const conceptNodeId = `${chapterId}-c-${idx}`;
      allConceptIds.push(conceptNodeId);
      insertConceptNode.run(conceptNodeId, c.name, c.real_life_application || '', JSON.stringify(c.day_to_day_usage || []));
      
      // Also map as a Topic for RAG indexing
      insertTopic.run(conceptNodeId, chapterId, c.name, c.purpose || '', `Mathematics > ${chapterName} > Concepts > ${c.name}`);
    });
  }

  // 3. Prerequisite node relationships (Graph edges)
  if (Array.isArray(lesson.prerequisite_nodes)) {
    lesson.prerequisite_nodes.forEach((preReq, idx) => {
      // Connect first concept of this chapter to the prerequisite node
      if (allConceptIds.length > 0) {
        const edgeId = `edge-${chapterId}-${idx}`;
        insertConceptNode.run(preReq, preReq.replace(/_/g, ' '), 'Prerequisite concept node', '[]');
        insertConceptEdge.run(edgeId, preReq, `${chapterId}-c-0`, 'PREREQUISITE');
      }
    });
  }

  // 4. Exercises & Problems (NCERT)
  if (lesson.exercises) {
    Object.keys(lesson.exercises).forEach(exKey => {
      const exercise = lesson.exercises[exKey];
      const topicId = `${chapterId}-${exKey}`;
      const exerciseTitle = exercise.title || exKey.replace(/_/g, ' ').toUpperCase();
      
      insertTopic.run(topicId, chapterId, exerciseTitle, exercise.objective || '', `Mathematics > ${chapterName} > Exercises > ${exerciseTitle}`);

      if (Array.isArray(exercise.problems)) {
        exercise.problems.forEach((prob, pIdx) => {
          const problemId = prob.id || `${topicId}-p-${pIdx}`;
          const qNum = pIdx + 1;
          const qText = prob.question || '';
          
          insertProblem.run(problemId, topicId, 'NCERT', exerciseTitle, qNum, qText, qText, 'MEDIUM', `${chapterId}-c-0`);

          // Solution steps
          if (Array.isArray(prob.solution)) {
            prob.solution.forEach((step, sIdx) => {
              const solId = `${problemId}-step-${sIdx}`;
              insertSolution.run(solId, problemId, sIdx + 1, step, step, JSON.stringify(prob.formulae_used || []), 'None');
            });
          } else if (typeof prob.solution === 'string') {
            insertSolution.run(`${problemId}-step-0`, problemId, 1, prob.solution, prob.solution, JSON.stringify(prob.formulae_used || []), 'None');
          }
        });
      }
    });
  }

  // 5. Reference Book Extensions (RD Sharma)
  if (lesson.rd_sharma_extensions && Array.isArray(lesson.rd_sharma_extensions.topics)) {
    lesson.rd_sharma_extensions.topics.forEach((t, tIdx) => {
      const topicId = `${chapterId}-rd-${tIdx}`;
      insertTopic.run(topicId, chapterId, `RD Sharma: ${t.name}`, t.method || '', `Mathematics > ${chapterName} > RD Sharma > ${t.name}`);

      if (Array.isArray(t.examples)) {
        t.examples.forEach((ex, exIdx) => {
          const probId = `${topicId}-p-${exIdx}`;
          insertProblem.run(probId, topicId, 'RD_SHARMA', 'RD Sharma Extensions', exIdx + 1, ex.problem || '', ex.problem || '', 'HARD', `${chapterId}-c-0`);
          
          if (Array.isArray(ex.solution)) {
            ex.solution.forEach((step, sIdx) => {
              insertSolution.run(`${probId}-step-${sIdx}`, probId, sIdx + 1, step, step, '[]', 'None');
            });
          }
        });
      }
    });
  }

  // 6. Reference Book Extensions (RS Aggarwal)
  if (lesson.rs_aggarwal_extensions && Array.isArray(lesson.rs_aggarwal_extensions.topics)) {
    lesson.rs_aggarwal_extensions.topics.forEach((t, tIdx) => {
      const topicId = `${chapterId}-rs-${tIdx}`;
      insertTopic.run(topicId, chapterId, `RS Aggarwal: ${t.name}`, t.method || '', `Mathematics > ${chapterName} > RS Aggarwal > ${t.name}`);

      if (Array.isArray(t.examples)) {
        t.examples.forEach((ex, exIdx) => {
          const probId = `${topicId}-p-${exIdx}`;
          insertProblem.run(probId, topicId, 'RS_AGARWAL', 'RS Aggarwal Extensions', exIdx + 1, ex.problem || '', ex.problem || '', 'MEDIUM', `${chapterId}-c-0`);
          
          if (Array.isArray(ex.solution)) {
            ex.solution.forEach((step, sIdx) => {
              insertSolution.run(`${probId}-step-${sIdx}`, probId, sIdx + 1, step, step, '[]', 'None');
            });
          }
        });
      }
    });
  }

  // 7. Model Papers
  if (lesson.model_papers) {
    const difficulties = ['simple', 'medium', 'complex'];
    difficulties.forEach(diff => {
      const paperProblems = lesson.model_papers[diff];
      if (Array.isArray(paperProblems)) {
        paperProblems.forEach((prob, pIdx) => {
          const topicId = `${chapterId}-model-${diff}`;
          // Ensure model topic exists
          insertTopic.run(topicId, chapterId, `Model Paper (${diff})`, 'Model practice papers', `Mathematics > ${chapterName} > Model Papers > ${diff}`);
          
          const probId = `${topicId}-p-${pIdx}`;
          insertProblem.run(probId, topicId, 'MODEL_PAPER', `Model Paper (${diff})`, pIdx + 1, prob.question || '', prob.question || '', diff.toUpperCase(), `${chapterId}-c-0`);

          if (Array.isArray(prob.steps)) {
            prob.steps.forEach((step, sIdx) => {
              insertSolution.run(`${probId}-step-${sIdx}`, probId, sIdx + 1, step, step, '[]', 'None');
            });
          }
        });
      }
    });
  }

  // 8. Vedic Mathematics Shortcuts
  if (Array.isArray(lesson.vedic_math_shortcuts)) {
    lesson.vedic_math_shortcuts.forEach((v, vIdx) => {
      const topicId = `${chapterId}-vedic-${vIdx}`;
      insertTopic.run(topicId, chapterId, `Vedic Math: ${v.title}`, v.concept || '', `Mathematics > ${chapterName} > Vedic Math > ${v.title}`);
      
      const conceptNodeId = `${chapterId}-vedic-c-${vIdx}`;
      insertConceptNode.run(conceptNodeId, v.title, v.sanskrit || '', JSON.stringify(v.examples || []));
      insertConceptEdge.run(`edge-vedic-${chapterId}-${vIdx}`, `${chapterId}-c-0`, conceptNodeId, 'RELATED_TO');

      // Map examples to problems
      if (Array.isArray(v.examples)) {
        v.examples.forEach((ex, exIdx) => {
          const probId = `${topicId}-p-${exIdx}`;
          insertProblem.run(probId, topicId, 'MODEL_PAPER', 'Vedic Mathematics Examples', exIdx + 1, ex.problem || '', ex.problem || '', 'EASY', conceptNodeId);
          insertSolution.run(`${probId}-step-0`, probId, 1, ex.explanation || '', ex.explanation || '', '[]', v.title);
        });
      }
    });
  }

  // 9. Flowcharts & Mind Maps as media attachments
  if (lesson.mind_maps) {
    const mm = lesson.mind_maps;
    const mediaId = `mm-${chapterId}`;
    insertMedia.run(mediaId, chapterId, 'CHAPTER', 'MIND_MAP', mm.title || 'Mind Map', '', '');
  }

  if (Array.isArray(lesson.flowcharts)) {
    lesson.flowcharts.forEach((fc, fcIdx) => {
      const mediaId = `fc-${chapterId}-${fcIdx}`;
      insertMedia.run(mediaId, chapterId, 'CHAPTER', 'FLOW_CHART', fc.title || 'Flow Chart', '', '');
    });
  }

});

console.log('Import completed successfully!');
db.close();
