const fs = require('fs');
const path = require('path');
const { db, initDatabase } = require('../lib/database');

console.log('🚀 Starting Comprehensive Ingestion with Q&A Notes for Math, Science & Social...');
initDatabase();

// 1. Prepare Database Statements
const insertSubject = db.prepare('INSERT OR REPLACE INTO subjects (id, name, description) VALUES (?, ?, ?)');
const insertChapter = db.prepare('INSERT OR REPLACE INTO chapters (id, subject_id, name, summary, board_source, academic_year) VALUES (?, ?, ?, ?, ?, ?)');
const insertTopic = db.prepare('INSERT OR REPLACE INTO topics (id, chapter_id, name, description, document_tree_path) VALUES (?, ?, ?, ?, ?)');
const insertConceptNode = db.prepare('INSERT OR REPLACE INTO concept_nodes (id, name, description, formulas) VALUES (?, ?, ?, ?)');
const insertConceptEdge = db.prepare('INSERT OR REPLACE INTO concept_edges (id, source_concept_id, target_concept_id, relation_type) VALUES (?, ?, ?, ?)');
const insertProblem = db.prepare('INSERT OR REPLACE INTO problems (id, topic_id, book_source, exercise_label, question_number, question_text, question_latex, difficulty, concept_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
const insertSolution = db.prepare('INSERT OR REPLACE INTO solutions (id, problem_id, step_number, step_explanation, step_latex, formula_used, vedic_shortcut_applied) VALUES (?, ?, ?, ?, ?, ?, ?)');

// 2. Define Subjects
const subjectsList = [
  ['mathematics', 'Mathematics', 'Class X Mathematics NCERT, RD Sharma & RS Aggarwal'],
  ['physics', 'Physics', 'NCERT Class X Physics - Light, Electricity, Magnetism & Energy'],
  ['chemistry', 'Chemistry', 'NCERT Class X Chemistry - Reactions, Acids, Bases, Metals & Carbon'],
  ['biology', 'Biology', 'NCERT Class X Biology - Life Processes, Control, Reproduction, Heredity'],
  ['social-studies', 'Social Studies', 'NCERT Class X Social Sciences - History, Geography, Civics & Economics']
];
subjectsList.forEach(s => insertSubject.run(...s));

function cleanId(val) {
  return val.replace(/\s+/g, '-').toLowerCase();
}

function processFolder(category, relativeDir, defaultSubjectId) {
  const targetDir = path.join(__dirname, '..', 'content', category, relativeDir);
  if (!fs.existsSync(targetDir)) {
    console.log(`Directory ${targetDir} does not exist. Skipping.`);
    return;
  }
  const jsonFiles = fs.readdirSync(targetDir).filter(f => f.endsWith('.json'));
  console.log(`📁 Ingesting ${jsonFiles.length} JSON files in content/${category}/${relativeDir}...`);

  jsonFiles.forEach(file => {
    const filePath = path.join(targetDir, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Determine the subject_id
      let fileSubjectId = defaultSubjectId;
      if (data.subject) {
        const mappedSub = data.subject.toLowerCase();
        if (mappedSub === 'history' || mappedSub === 'civics' || mappedSub === 'geography' || mappedSub === 'economics') {
          fileSubjectId = 'social-studies';
        } else if (mappedSub === 'physics' || mappedSub === 'chemistry' || mappedSub === 'biology') {
          fileSubjectId = mappedSub;
        }
      }

      // Check if this file follows a multi-chapter format or a single-chapter format
      if (data.chapters && Array.isArray(data.chapters)) {
        // Multi-chapter syllabus structure
        data.chapters.forEach(ch => {
          const chapterId = ch.id;
          insertChapter.run(chapterId, fileSubjectId, ch.name, ch.summary || '', 'CBSE_NCERT', '2026-27');
          let defaultConceptId = `${chapterId}-c-0`;

          if (Array.isArray(ch.topics)) {
            ch.topics.forEach((t, idx) => {
              const tName = typeof t === 'string' ? t : (t.name || `Topic ${idx+1}`);
              const tDesc = typeof t === 'string' ? `Understanding ${t}` : (t.description || '');
              const topicId = `${chapterId}-t-${idx}`;
              insertTopic.run(topicId, chapterId, tName, tDesc, `${data.subject} > ${ch.name} > ${tName}`);
              
              const conceptId = `${chapterId}-c-${idx}`;
              if (idx === 0) defaultConceptId = conceptId;
              insertConceptNode.run(conceptId, tName, tDesc, '{}');
              insertConceptEdge.run(`edge-${chapterId}-${idx}`, `${chapterId}-c-0`, conceptId, 'RELATED_TO');
            });
          }

          if (Array.isArray(ch.exercises)) {
            ch.exercises.forEach((ex, exIdx) => {
              const topicId = `${chapterId}-t-0`;
              const probId = `p-${chapterId}-${exIdx}`;
              insertProblem.run(probId, topicId, 'NCERT', 'Exercise Q&A', exIdx + 1, ex.question, ex.question, 'MEDIUM', defaultConceptId);
              
              if (Array.isArray(ex.solution)) {
                ex.solution.forEach((step, sIdx) => {
                  insertSolution.run(`${probId}-s-${sIdx}`, probId, sIdx + 1, step, step, '[]', 'None');
                });
              } else if (typeof ex.solution === 'string') {
                insertSolution.run(`${probId}-s-0`, probId, 1, ex.solution, ex.solution, '[]', 'None');
              }
            });
          }
        });
      } else {
        // Single-chapter detailed notes format
        const chapterId = data.id || path.basename(file, '.json');
        const chapterName = data.chapter || data.title || chapterId;
        const summary = data.title || '';

        insertChapter.run(chapterId, fileSubjectId, chapterName, summary, 'CBSE_NCERT', '2026-27');
        let defaultConceptId = `${chapterId}-c-0`;

        if (Array.isArray(data.concepts)) {
          data.concepts.forEach((c, idx) => {
            const cName = c.name || `Concept ${idx+1}`;
            const cDesc = c.real_life_application || c.purpose || '';
            const cUsage = c.day_to_day_usage ? JSON.stringify(c.day_to_day_usage) : '[]';
            const conceptNodeId = `${chapterId}-c-${idx}`;
            if (idx === 0) defaultConceptId = conceptNodeId;

            insertConceptNode.run(conceptNodeId, cName, cDesc, cUsage);

            const topicId = `${chapterId}-t-c-${idx}`;
            insertTopic.run(topicId, chapterId, cName, cDesc, `${data.subject || fileSubjectId} > ${chapterName} > Concepts > ${cName}`);
          });
        }

        if (data.exercises) {
          if (Array.isArray(data.exercises)) {
            data.exercises.forEach((ex, exIdx) => {
              const topicId = `${chapterId}-t-ex-${exIdx}`;
              insertTopic.run(topicId, chapterId, ex.title || `Exercise ${exIdx+1}`, '', `${data.subject || fileSubjectId} > ${chapterName} > ${ex.title || 'Exercise'}`);

              if (Array.isArray(ex.problems)) {
                ex.problems.forEach((prob, pIdx) => {
                  const probId = prob.id || `${topicId}-p-${pIdx}`;
                  insertProblem.run(probId, topicId, prob.book_source || 'NCERT', ex.title || 'Exercise', pIdx + 1, prob.question, prob.question, prob.difficulty || 'MEDIUM', defaultConceptId);
                  
                  if (Array.isArray(prob.solution)) {
                    prob.solution.forEach((step, sIdx) => {
                      insertSolution.run(`${probId}-s-${sIdx}`, probId, sIdx + 1, step, step, '[]', 'None');
                    });
                  } else if (typeof prob.solution === 'string') {
                    insertSolution.run(`${probId}-s-0`, probId, 1, prob.solution, prob.solution, '[]', 'None');
                  }
                });
              }
            });
          } else if (typeof data.exercises === 'object') {
            Object.entries(data.exercises).forEach(([exKey, ex], exIdx) => {
              const topicId = `${chapterId}-t-${exKey}`;
              insertTopic.run(topicId, chapterId, ex.title || exKey, ex.objective || '', `${data.subject || fileSubjectId} > ${chapterName} > Exercises > ${ex.title || exKey}`);

              if (Array.isArray(ex.problems)) {
                ex.problems.forEach((prob, pIdx) => {
                  const probId = prob.id || `${topicId}-p-${pIdx}`;
                  insertProblem.run(probId, topicId, prob.book_source || 'NCERT', ex.title || exKey, pIdx + 1, prob.question, prob.question, prob.difficulty || 'MEDIUM', defaultConceptId);
                  
                  if (Array.isArray(prob.solution)) {
                    prob.solution.forEach((step, sIdx) => {
                      insertSolution.run(`${probId}-s-${sIdx}`, probId, sIdx + 1, step, step, '[]', 'None');
                    });
                  } else if (typeof prob.solution === 'string') {
                    insertSolution.run(`${probId}-s-0`, probId, 1, prob.solution, prob.solution, '[]', 'None');
                  }
                });
              }
            });
          }
        }
      }
    } catch (err) {
      console.error(`Error processing ${filePath}:`, err.message);
    }
  });
}

// 3. Process each subject directory
// Mathematics (under content/mathematics/)
processFolder('', 'mathematics', 'mathematics');

// Science (under content/science/cbse_ncert/)
processFolder('science', 'cbse_ncert', 'physics'); // defaults to physics, but maps internally inside processFolder

// Support distinct folder paths if loaded from content/physics etc.
processFolder('', 'physics', 'physics');
processFolder('', 'chemistry', 'chemistry');
processFolder('', 'biology', 'biology');

// Social (under content/social/cbse_ncert/)
processFolder('social', 'cbse_ncert', 'social-studies');

// 4. Seeding advanced Math extensions to make sure nothing is broken
console.log('📐 Re-applying RD Sharma & RS Aggarwal Math extensions...');
try {
  // Rather than requiring which closes DB, we can manually check if it exists or do it dynamically.
  // We can read it and run it, or dynamically load seedExtensions but handle the DB carefully.
  // We'll read seedExtensions.js source code, strip out the db.close() statement, and evaluate or run it.
  const seedExtCode = fs.readFileSync(path.join(__dirname, 'seedExtensions.js'), 'utf8')
    .replace('db.close();', '// db.close() stripped to keep connection active');
  
  const tempSeedPath = path.join(__dirname, 'tempSeedExtensions.js');
  fs.writeFileSync(tempSeedPath, seedExtCode);
  require('./tempSeedExtensions');
  fs.unlinkSync(tempSeedPath);
} catch (e) {
  console.log('seedExtensions notice:', e.message);
}

console.log('✅ Auto-Ingestion of Mathematics, Science, and Social Q&A Notes completed successfully!');
const chapterCount = db.prepare('SELECT count(*) as cnt FROM chapters').get().cnt;
const problemCount = db.prepare('SELECT count(*) as cnt FROM problems').get().cnt;
console.log(`Database validation check: ${chapterCount} chapters, ${problemCount} problems total.`);
db.close();
