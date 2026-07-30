const { db, initDatabase } = require('../lib/database');

console.log('Initializing database schema...');
initDatabase();

console.log('Seeding database tables...');

// Helper to run clean executes
function execSQL(sql) {
  db.exec(sql);
}

// Clear old data
execSQL('DELETE FROM media_attachments;');
execSQL('DELETE FROM solutions;');
execSQL('DELETE FROM problems;');
execSQL('DELETE FROM concept_edges;');
execSQL('DELETE FROM concept_nodes;');
execSQL('DELETE FROM topics;');
execSQL('DELETE FROM chapters;');
execSQL('DELETE FROM subjects;');

// Prepare statements
const insertSubject = db.prepare('INSERT INTO subjects (id, name, description) VALUES (?, ?, ?)');
const insertChapter = db.prepare('INSERT INTO chapters (id, subject_id, name, summary, board_source, academic_year) VALUES (?, ?, ?, ?, ?, ?)');
const insertTopic = db.prepare('INSERT INTO topics (id, chapter_id, name, description, document_tree_path) VALUES (?, ?, ?, ?, ?)');
const insertConceptNode = db.prepare('INSERT INTO concept_nodes (id, name, description, formulas) VALUES (?, ?, ?, ?)');
const insertConceptEdge = db.prepare('INSERT INTO concept_edges (id, source_concept_id, target_concept_id, relation_type) VALUES (?, ?, ?, ?)');
const insertProblem = db.prepare('INSERT INTO problems (id, topic_id, book_source, exercise_label, question_number, question_text, question_latex, difficulty, concept_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
const insertSolution = db.prepare('INSERT INTO solutions (id, problem_id, step_number, step_explanation, step_latex, formula_used, vedic_shortcut_applied) VALUES (?, ?, ?, ?, ?, ?, ?)');
const insertMedia = db.prepare('INSERT INTO media_attachments (id, target_id, target_type, media_type, title, media_url, thumbnail_url) VALUES (?, ?, ?, ?, ?, ?, ?)');

// 1. Seed Subject
insertSubject.run('mathematics', 'Mathematics', 'Mathematics covering Class X curriculum with JEE/NEET foundations.');

// 2. Seed Chapters
insertChapter.run('real-numbers-cbse', 'mathematics', 'Real Numbers (CBSE)', 'Properties of real numbers, HCF, LCM, and proof of irrationality.', 'CBSE_NCERT', '2026-27');
insertChapter.run('linear-eq-cbse', 'mathematics', 'Pair of Linear Equations in Two Variables (CBSE)', 'Graphical and algebraic solutions of simultaneous linear equations.', 'CBSE_NCERT', '2026-27');
insertChapter.run('linear-eq-ap', 'mathematics', 'Linear Equations in Two Variables (AP State Board)', 'Syllabus and exercises mapped to the Andhra Pradesh State Board curriculum.', 'AP_BOARD', '2026-27');
insertChapter.run('linear-eq-ts', 'mathematics', 'Linear Equations in Two Variables (TS State Board)', 'Syllabus and exercises mapped to the Telangana State Board curriculum.', 'TS_BOARD', '2026-27');

// 3. Seed Topics
insertTopic.run('fundamental-arithmetic', 'real-numbers-cbse', 'Fundamental Theorem of Arithmetic', 'Every composite number can be expressed as a product of primes uniquely.', 'Mathematics > Real Numbers > Fundamental Theorem of Arithmetic');
insertTopic.run('irrational-proofs', 'real-numbers-cbse', 'Proof of Irrationality', 'Proving √2, √3, √5 are irrational.', 'Mathematics > Real Numbers > Proof of Irrationality');

insertTopic.run('linear-eq-graphical', 'linear-eq-cbse', 'Graphical Method of Solution', 'Plotting two linear equations to find their point of intersection.', 'Mathematics > Pair of Linear Equations > Graphical Method');
insertTopic.run('linear-eq-algebraic', 'linear-eq-cbse', 'Algebraic Methods (Substitution & Elimination)', 'Solving systems using substitution and elimination techniques.', 'Mathematics > Pair of Linear Equations > Algebraic Methods');

insertTopic.run('linear-eq-ap-problems', 'linear-eq-ap', 'Linear Systems & Applications (AP)', 'AP Board specific exercises and state-level board problems.', 'Mathematics > AP Board Linear Equations > Applications');
insertTopic.run('linear-eq-ts-problems', 'linear-eq-ts', 'Linear Systems & Applications (TS)', 'TS Board specific exercises and state-level board problems.', 'Mathematics > TS Board Linear Equations > Applications');

// 4. Seed Concept Nodes (Knowledge Graph)
insertConceptNode.run('c-lin-eq-1var', 'Linear Equations in One Variable', 'Prerequisite concept involving equations of the form ax + b = 0.', '{"standard_form": "ax + b = 0"}');
insertConceptNode.run('c-lin-eq-2var', 'Linear Equations in Two Variables', 'System of two linear equations with two unknowns.', '{"standard_form": "a_1x + b_1y + c_1 = 0 \\\\text{ and } a_2x + b_2y + c_2 = 0"}');
insertConceptNode.run('c-graph-lines', 'Graphical Representation of Lines', 'Intersecting, parallel, or coincident lines based on ratio coefficients.', '{"intersecting": "a_1/a_2 \\\\neq b_1/b_2", "coincident": "a_1/a_2 = b_1/b_2 = c_1/c_2", "parallel": "a_1/a_2 = b_1/b_2 \\\\neq c_1/c_2"}');
insertConceptNode.run('c-algebra-methods', 'Algebraic Methods of Solving Systems', 'Methods like elimination by coefficient matching or direct substitution.', '{"elimination": "Multiply by coefficients to align variables", "substitution": "Express x in terms of y and substitute"}');

// 5. Seed Concept Edges (Graph Relationships)
insertConceptEdge.run('edge1', 'c-lin-eq-1var', 'c-lin-eq-2var', 'PREREQUISITE');
insertConceptEdge.run('edge2', 'c-lin-eq-2var', 'c-graph-lines', 'RELATED_TO');
insertConceptEdge.run('edge3', 'c-lin-eq-2var', 'c-algebra-methods', 'RELATED_TO');

// 6. Seed Problems (NCERT, RD Sharma, RS Aggarwal, Model Papers)
// Problem 1: NCERT - Exercise 3.2, Q1
insertProblem.run('p-ncert-3.2-1', 'linear-eq-graphical', 'NCERT', 'Exercise 3.2', 1, 
  'Form the pair of linear equations and find their solutions graphically: 10 students of Class X took part in a Mathematics quiz. If the number of girls is 4 more than the number of boys, find the number of boys and girls.',
  'x + y = 10, \\quad y = x + 4', 'MEDIUM', 'c-lin-eq-2var');

// Problem 2: RD Sharma - High Difficulty / System of equations
insertProblem.run('p-rd-sharma-ch3-1', 'linear-eq-algebraic', 'RD_SHARMA', 'Chapter 3, Ex 3.3', 15,
  'Solve the system of equations using elimination: 152x - 378y = -74 and -378x + 152y = -604.',
  '152x - 378y = -74, \\quad -378x + 152y = -604', 'HARD', 'c-algebra-methods');

// Problem 3: RS Aggarwal - Exercise 3A Q12
insertProblem.run('p-rs-aggarwal-ch3-12', 'linear-eq-algebraic', 'RS_AGARWAL', 'Exercise 3A', 12,
  'Solve for x and y: 2x + 3y = 11 and 2x - 4y = -24.',
  '2x + 3y = 11, \\quad 2x - 4y = -24', 'EASY', 'c-algebra-methods');

// Problem 4: Model Paper Q5 (Competitive style)
insertProblem.run('p-model-paper-5', 'linear-eq-algebraic', 'MODEL_PAPER', 'Model Test 1', 5,
  'Find the value of k for which the system of equations kx + 3y = k-3 and 12x + ky = k has infinitely many solutions.',
  'kx + 3y = k-3, \\quad 12x + ky = k', 'HARD', 'c-graph-lines');

// 7. Seed Solutions (Step-by-step with formulas and Vedic Mathematics shortcuts)
// Solutions for Problem 1 (NCERT girls/boys graphical)
insertSolution.run('s-ncert-3.2-1-s1', 'p-ncert-3.2-1', 1,
  'Let the number of boys be x and the number of girls be y. According to the first condition, the total number of students is 10.',
  'x + y = 10', 'None', 'None');
insertSolution.run('s-ncert-3.2-1-s2', 'p-ncert-3.2-1', 2,
  'According to the second condition, the number of girls is 4 more than the number of boys.',
  'y = x + 4 \\implies y - x = 4', 'None', 'None');
insertSolution.run('s-ncert-3.2-1-s3', 'p-ncert-3.2-1', 3,
  'To solve graphically, we find coordinates for both lines. For x + y = 10, when x=5, y=5; when x=3, y=7. For y - x = 4, when x=0, y=4; when x=3, y=7.',
  '\\text{Line 1: } (5,5), (3,7) \\quad \\text{Line 2: } (0,4), (3,7)', 'None', 'None');
insertSolution.run('s-ncert-3.2-1-s4', 'p-ncert-3.2-1', 4,
  'Plotting these lines on a graph, they intersect at the point (3, 7). Therefore, x = 3 (boys) and y = 7 (girls).',
  'x = 3, \\quad y = 7', 'None', 'Vedic Shortcut: Since we have a simple sum-and-difference system (x+y=S, y-x=D), we can solve instantly using the Vedic formula: larger (y) = (S+D)/2 and smaller (x) = (S-D)/2. Here, y = (10+4)/2 = 7, and x = (10-4)/2 = 3.');

// Solutions for Problem 2 (RD Sharma large numbers - highly complex elimination)
insertSolution.run('s-rd-sharma-s1', 'p-rd-sharma-ch3-1', 1,
  'Notice that the coefficients of x and y in the equations are symmetric: a1=b2=152 and a2=b1=-378. For symmetric systems, first add the two equations.',
  '(152 - 378)x + (-378 + 152)y = -74 - 604 \\implies -226x - 226y = -678', 'None', 'None');
insertSolution.run('s-rd-sharma-s2', 'p-rd-sharma-ch3-1', 2,
  'Divide the resulting equation by -226 to get a simplified equation (Equation 3).',
  'x + y = 3 \\quad \\text{--- (Equation 3)}', 'None', 'None');
insertSolution.run('s-rd-sharma-s3', 'p-rd-sharma-ch3-1', 3,
  'Next, subtract the second equation from the first to get another simplified equation (Equation 4).',
  '(152 - (-378))x + (-378 - 152)y = -74 - (-604) \\implies 530x - 530y = 530', 'None', 'None');
insertSolution.run('s-rd-sharma-s4', 'p-rd-sharma-ch3-1', 4,
  'Divide this equation by 530 to get Equation 4.',
  'x - y = 1 \\quad \\text{--- (Equation 4)}', 'None', 'None');
insertSolution.run('s-rd-sharma-s5', 'p-rd-sharma-ch3-1', 5,
  'Solve Equation 3 and Equation 4 simultaneously. Adding them gives 2x = 4, so x = 2. Substituting x=2 gives y = 1.',
  'x = 2, \\quad y = 1', 'None', 'Vedic Shortcut: Use the Vedic Sutra "Paravartya Yojayet" (Transpose and Apply) to solve instantly from Equation 3 and 4: x = (3+1)/2 = 2, y = (3-1)/2 = 1.');

// Solutions for Problem 3 (RS Aggarwal)
insertSolution.run('s-rs-aggarwal-s1', 'p-rs-aggarwal-ch3-12', 1,
  'We have two equations: (1) 2x + 3y = 11 and (2) 2x - 4y = -24. Subtract equation (2) from equation (1) to eliminate x.',
  '(2x + 3y) - (2x - 4y) = 11 - (-24) \\implies 7y = 35', 'None', 'None');
insertSolution.run('s-rs-aggarwal-s2', 'p-rs-aggarwal-ch3-12', 2,
  'Divide by 7 to find y.',
  'y = 5', 'None', 'None');
insertSolution.run('s-rs-aggarwal-s3', 'p-rs-aggarwal-ch3-12', 3,
  'Substitute y = 5 into equation (1) to solve for x.',
  '2x + 3(5) = 11 \\implies 2x + 15 = 11 \\implies 2x = -4 \\implies x = -2', 'None', 'Vedic Shortcut (Sunyam Samyasamuccaye): To solve systems directly of the form a1 x + b1 y = c1, a2 x + b2 y = c2, the x-value is x = (b1*c2 - b2*c1)/(b1*a2 - b2*a1). Here, x = (3*(-24) - (-4)*11) / (3*2 - (-4)*2) = (-72 + 44) / (6 + 8) = -28 / 14 = -2.');

// 8. Seed Media Attachments (Videos, Mind Maps, Infographics)
insertMedia.run('m-video-1', 'linear-eq-graphical', 'TOPIC', 'VIDEO', 'Graphical Method of Solving Linear Equations', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg');
insertMedia.run('m-mindmap-1', 'linear-eq-cbse', 'CHAPTER', 'MIND_MAP', 'Pair of Linear Equations Mind Map', '/data/media/mindmap-linear.png', '');
insertMedia.run('m-flowchart-1', 'linear-eq-algebraic', 'TOPIC', 'FLOW_CHART', 'Solving Systems Decision Chart', '/data/media/flowchart-solving.png', '');
insertMedia.run('m-infographic-1', 'c-graph-lines', 'TOPIC', 'INFOGRAPHIC', 'Linear Coefficients & Slopes Infographic', '/data/media/infographic-coefficients.png', '');

console.log('Database seeded successfully!');
db.close();
