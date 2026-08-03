/**
 * Idempotent base seed.
 *
 * On the base knowledge graph, NCERT fixtures, and solutions that the app's
 * RAG/AI-tutor service depends on (see lib/ragService, services/aiTutor.js and
 * tests/database.test.js). Unlike `seed.js` this NEVER deletes existing data —
 * it inserts-or-replaces only the rows that must always exist, so it is safe to
 * re-run on top of full ingests from scripts/ingestAllLessons.js.
 */
'use strict';

const { db, initDatabase } = require('../lib/database');

initDatabase();

const insertSubject = db.prepare('INSERT OR REPLACE INTO subjects (id, name, description) VALUES (?, ?, ?)');
const insertChapter = db.prepare('INSERT OR REPLACE INTO chapters (id, subject_id, name, summary, board_source, academic_year) VALUES (?, ?, ?, ?, ?, ?)');
const insertTopic = db.prepare('INSERT OR REPLACE INTO topics (id, chapter_id, name, description, document_tree_path) VALUES (?, ?, ?, ?, ?)');
const insertConceptNode = db.prepare('INSERT OR REPLACE INTO concept_nodes (id, name, description, formulas) VALUES (?, ?, ?, ?)');
const insertConceptEdge = db.prepare('INSERT OR REPLACE INTO concept_edges (id, source_concept_id, target_concept_id, relation_type) VALUES (?, ?, ?, ?)');
const insertProblem = db.prepare('INSERT OR REPLACE INTO problems (id, topic_id, book_source, exercise_label, question_number, question_text, question_latex, difficulty, concept_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
const insertSolution = db.prepare('INSERT OR REPLACE INTO solutions (id, problem_id, step_number, step_explanation, step_latex, formula_used, vedic_shortcut_applied) VALUES (?, ?, ?, ?, ?, ?, ?)');

insertSubject.run('mathematics', 'Mathematics', 'Mathematics covering Class X curriculum with JEE/NEET foundations.');

insertChapter.run('linear-eq-cbse', 'mathematics', 'Pair of Linear Equations in Two Variables (CBSE)', 'Graphical and algebraic solutions of simultaneous linear equations.', 'CBSE_NCERT', '2026-27');

insertTopic.run('linear-eq-graphical', 'linear-eq-cbse', 'Graphical Method of Solution', 'Plotting two linear equations to find their point of intersection.', 'Mathematics > Pair of Linear Equations > Graphical Method');
insertTopic.run('linear-eq-algebraic', 'linear-eq-cbse', 'Algebraic Methods (Substitution & Elimination)', 'Solving systems using substitution and elimination techniques.', 'Mathematics > Pair of Linear Equations > Algebraic Methods');

insertConceptNode.run('c-lin-eq-1var', 'Linear Equations in One Variable', 'Prerequisite concept involving equations of the form ax + b = 0.', '{"standard_form": "ax + b = 0"}');
insertConceptNode.run('c-lin-eq-2var', 'Linear Equations in Two Variables', 'System of two linear equations with two unknowns.', '{"standard_form": "a_1x + b_1y + c_1 = 0 \\\\text{ and } a_2x + b_2y + c_2 = 0"}');
insertConceptNode.run('c-graph-lines', 'Graphical Representation of Lines', 'Intersecting, parallel, or coincident lines based on ratio coefficients.', '{"intersecting": "a_1/a_2 \\\\neq b_1/b_2", "coincident": "a_1/a_2 = b_1/b_2 = c_1/c_2", "parallel": "a_1/a_2 = b_1/b_2 \\\\neq c_1/c_2"}');
insertConceptNode.run('c-algebra-methods', 'Algebraic Methods of Solving Systems', 'Methods like elimination by coefficient matching or direct substitution.', '{"elimination": "Multiply by coefficients to align variables", "substitution": "Express x in terms of y and substitute"}');

insertConceptEdge.run('edge1', 'c-lin-eq-1var', 'c-lin-eq-2var', 'PREREQUISITE');
insertConceptEdge.run('edge2', 'c-lin-eq-2var', 'c-graph-lines', 'RELATED_TO');
insertConceptEdge.run('edge3', 'c-lin-eq-2var', 'c-algebra-methods', 'RELATED_TO');

insertProblem.run('p-ncert-3.2-1', 'linear-eq-graphical', 'NCERT', 'Exercise 3.2', 1,
  'Form the pair of linear equations and find their solutions graphically: 10 students of Class X took part in a Mathematics quiz. If the number of girls is 4 more than the number of boys, find the number of boys and girls.',
  'x + y = 10, \\quad y = x + 4', 'MEDIUM', 'c-lin-eq-2var');

insertSolution.run('s-ncert-3.2-1-s1', 'p-ncert-3.2-1', 1,
  'Let the number of boys be x and the number of girls be y. According to the first condition, the total number of students is 10.',
  'x + y = 10', 'None', 'None');
insertSolution.run('s-ncert-3.2-1-s2', 'p-ncert-3.2-1', 2,
  'According to the second condition, the number of girls is 4 more than the number of boys.',
  'y = x + 4 \\implies y - x = 4', 'None', 'None');
insertSolution.run('s-ncert-3.2-1-s3', 'p-ncert-3.2-1', 3,
  'To solve graphically, find coordinates for both lines. For x + y = 10, when x=5 y=5; when x=3 y=7. For y - x = 4, when x=0 y=4; when x=3 y=7.',
  '\\text{Line 1: } (5,5), (3,7) \\quad \\text{Line 2: } (0,4), (3,7)', 'None', 'None');
insertSolution.run('s-ncert-3.2-1-s4', 'p-ncert-3.2-1', 4,
  'Plotting these lines on a graph, they intersect at the point (3, 7). Therefore, x = 3 (boys) and y = 7 (girls).',
  'x = 3, \\quad y = 7', 'None', 'Vedic Shortcut: larger (y) = (S+D)/2 and smaller (x) = (S-D)/2. Here, y = (10+4)/2 = 7 and x = (10-4)/2 = 3.');

console.log('Base seed data ensured (idempotent).');
db.close();