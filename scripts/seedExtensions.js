const { db } = require('../lib/database');

console.log('Seeding advanced RD Sharma / RS Aggarwal textbook extensions...');

const insertTopic = db.prepare('INSERT OR REPLACE INTO topics (id, chapter_id, name, description, document_tree_path) VALUES (?, ?, ?, ?, ?)');
const insertConceptNode = db.prepare('INSERT OR REPLACE INTO concept_nodes (id, name, description, formulas) VALUES (?, ?, ?, ?)');
const insertConceptEdge = db.prepare('INSERT OR REPLACE INTO concept_edges (id, source_concept_id, target_concept_id, relation_type) VALUES (?, ?, ?, ?)');
const insertProblem = db.prepare('INSERT OR REPLACE INTO problems (id, topic_id, book_source, exercise_label, question_number, question_text, question_latex, difficulty, concept_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
const insertSolution = db.prepare('INSERT OR REPLACE INTO solutions (id, problem_id, step_number, step_explanation, step_latex, formula_used, vedic_shortcut_applied) VALUES (?, ?, ?, ?, ?, ?, ?)');

// 1. Polynomials: Relationship between coefficients and zeroes of cubic polynomials (RD Sharma Ex 2.2)
insertTopic.run(
  'poly-cubic-ratios',
  'polynomials',
  'Cubic Polynomials & Coefficient Relations',
  'Understanding how the sum, product, and pairwise sum of roots relates to cubic coefficients.',
  'Mathematics > Polynomials > Cubic Polynomials'
);
insertConceptNode.run(
  'c-cubic-relations',
  'Cubic Polynomial Root Relations',
  'Everyday Analogy: Think of brewing tea. The ratio of water, milk, and sugar (coefficients) dictates the sweetness and volume (roots). Adjusting coefficients changes roots predictably.',
  '{"sum": "\\\\alpha + \\\\beta + \\\\gamma = -b/a", "pairwise_sum": "\\\\alpha\\\\beta + \\\\beta\\\\gamma + \\\\gamma\\\\alpha = c/a", "product": "\\\\alpha\\\\beta\\\\gamma = -d/a"}'
);
insertConceptEdge.run('edge-cubic', 'polynomials-c-0', 'c-cubic-relations', 'EXTENSION_OF');
insertProblem.run(
  'p-rd-cubic-1',
  'poly-cubic-ratios',
  'RD_SHARMA',
  'Chapter 2, Ex 2.2',
  1,
  'Verify that 3, -1, -1/3 are the zeroes of the cubic polynomial p(x) = 3x^3 - 5x^2 - 11x - 3, and then verify the relationship between the zeroes and the coefficients.',
  'p(x) = 3x^3 - 5x^2 - 11x - 3',
  'HARD',
  'c-cubic-relations'
);
// Solutions for RD Sharma Cubic
insertSolution.run('s-rd-cubic-1-s1', 'p-rd-cubic-1', 1,
  'Verify first root (x = 3) by substituting into p(x).',
  'p(3) = 3(3)^3 - 5(3)^2 - 11(3) - 3 = 81 - 45 - 33 - 3 = 0', 'p(x) = 0', 'None');
insertSolution.run('s-rd-cubic-1-s2', 'p-rd-cubic-1', 2,
  'Verify second root (x = -1) by substituting into p(x).',
  'p(-1) = 3(-1)^3 - 5(-1)^2 - 11(-1) - 3 = -3 - 5 + 11 - 3 = 0', 'p(x) = 0', 'None');
insertSolution.run('s-rd-cubic-1-s3', 'p-rd-cubic-1', 3,
  'Verify third root (x = -1/3) by substituting into p(x).',
  'p(-1/3) = 3(-1/27) - 5(1/9) - 11(-1/3) - 3 = -1/9 - 5/9 + 33/9 - 27/9 = 0', 'p(x) = 0', 'None');
insertSolution.run('s-rd-cubic-1-s4', 'p-rd-cubic-1', 4,
  'Now verify coefficients. Given cubic ax^3 + bx^2 + cx + d, here a=3, b=-5, c=-11, d=-3. Sum of roots: alpha + beta + gamma.',
  '3 + (-1) + (-1/3) = 2 - 1/3 = 5/3 \\quad \\text{and} \\quad -b/a = -(-5)/3 = 5/3', '\\alpha+\\beta+\\gamma = -b/a', 'None');
insertSolution.run('s-rd-cubic-1-s5', 'p-rd-cubic-1', 5,
  'Verify product of roots: alpha * beta * gamma.',
  '3 \\times (-1) \\times (-1/3) = 1 \\quad \\text{and} \\quad -d/a = -(-3)/3 = 1', '\\alpha\\beta\\gamma = -d/a', 'None');


// 2. Quadratic Equations: Completing the Square Method (RS Aggarwal Ex 4B)
insertTopic.run(
  'quad-completing-square',
  'quadratic-equations',
  'Completing the Square Method',
  'Converting a quadratic equation into a perfect square form to solve easily.',
  'Mathematics > Quadratic Equations > Completing the Square'
);
insertConceptNode.run(
  'c-complete-square',
  'Completing the Square',
  'Everyday Analogy: Think of arranging a square seating layout for a wedding. If you have a rectangular grid with some chairs missing to make it a perfect square, you "add" the missing section and subtract it elsewhere to keep the total count balanced.',
  '{"square_form": "(x + b/2a)^2 = (b^2 - 4ac)/4a^2"}'
);
insertConceptEdge.run('edge-quad-sq', 'quadratic-equations-c-0', 'c-complete-square', 'EXTENSION_OF');
insertProblem.run(
  'p-rs-quad-1',
  'quad-completing-square',
  'RS_AGARWAL',
  'Exercise 4B',
  5,
  'Solve the quadratic equation by completing the square: 2x^2 - 5x + 3 = 0.',
  '2x^2 - 5x + 3 = 0',
  'HARD',
  'c-complete-square'
);
insertSolution.run('s-rs-quad-1-s1', 'p-rs-quad-1', 1,
  'Divide the entire equation by 2 to make the coefficient of x^2 equal to 1.',
  'x^2 - \\frac{5}{2}x + \\frac{3}{2} = 0', 'None', 'None');
insertSolution.run('s-rs-quad-1-s2', 'p-rs-quad-1', 2,
  'Shift the constant term to the right-hand side.',
  'x^2 - \\frac{5}{2}x = -\\frac{3}{2}', 'None', 'None');
insertSolution.run('s-rs-quad-1-s3', 'p-rs-quad-1', 3,
  'Add the square of half the coefficient of x to both sides. Half of -5/2 is -5/4, and its square is 25/16.',
  'x^2 - \\frac{5}{2}x + \\frac{25}{16} = -\\frac{3}{2} + \\frac{25}{16}', 'None', 'None');
insertSolution.run('s-rs-quad-1-s4', 'p-rs-quad-1', 4,
  'Rewrite the left side as a perfect square and simplify the right side.',
  '\\left(x - \\frac{5}{4}\\right)^2 = -\\frac{24}{16} + \\frac{25}{16} = \\frac{1}{16}', '(a-b)^2 = a^2-2ab+b^2', 'None');
insertSolution.run('s-rs-quad-1-s5', 'p-rs-quad-1', 5,
  'Take the square root of both sides and solve for x.',
  'x - \\frac{5}{4} = \\pm\\frac{1}{4} \\implies x = \\frac{5}{4} + \\frac{1}{4} = \frac{6}{4} = \frac{3}{2} \\quad \\text{or} \\quad x = \\frac{5}{4} - \\frac{1}{4} = 1', 'None', 'None');


// 3. Coordinate Geometry: Area of a Coordinate Triangle (RD Sharma Ex 14.4)
insertTopic.run(
  'coord-triangle-area',
  'coordinate-geometry',
  'Area of a Triangle in Coordinates',
  'Finding the area of a triangle when the coordinates of its three vertices are given.',
  'Mathematics > Coordinate Geometry > Area of Triangle'
);
insertConceptNode.run(
  'c-coord-area',
  'Coordinate Area Formula',
  'Everyday Analogy: Think of measuring a triangular garden plot using corner flags. Instead of measuring heights/slopes, you just note down the grid coordinates of the three flags and apply the formula.',
  '{"area": "Area = \\\\frac{1}{2} |x_1(y_2 - y_3) + x_2(y_3 - y_1) + x_3(y_1 - y_2)|"}'
);
insertConceptEdge.run('edge-coord-area', 'coordinate-geometry-c-0', 'c-coord-area', 'EXTENSION_OF');
insertProblem.run(
  'p-rd-coord-1',
  'coord-triangle-area',
  'RD_SHARMA',
  'Chapter 14, Ex 14.4',
  3,
  'Find the area of the triangle whose vertices are A(1, -1), B(-4, 6), and C(-3, -5).',
  'A(1, -1), B(-4, 6), C(-3, -5)',
  'MEDIUM',
  'c-coord-area'
);
insertSolution.run('s-rd-coord-1-s1', 'p-rd-coord-1', 1,
  'Identify coordinate values: x1=1, y1=-1; x2=-4, y2=6; x3=-3, y3=-5.',
  'x_1=1, y_1=-1, x_2=-4, y_2=6, x_3=-3, y_3=-5', 'None', 'None');
insertSolution.run('s-rd-coord-1-s2', 'p-rd-coord-1', 2,
  'Substitute coordinates into the coordinate area formula.',
  'Area = \\frac{1}{2} |1(6 - (-5)) + (-4)(-5 - (-1)) + (-3)(-1 - 6)|', 'Area Formula', 'None');
insertSolution.run('s-rd-coord-1-s3', 'p-rd-coord-1', 3,
  'Simplify inside the absolute value brackets.',
  'Area = \\frac{1}{2} |1(11) + (-4)(-4) + (-3)(-7)| = \\frac{1}{2} |11 + 16 + 21|', 'None', 'None');
insertSolution.run('s-rd-coord-1-s4', 'p-rd-coord-1', 4,
  'Sum values and divide by 2 to get final area.',
  'Area = \\frac{1}{2} |48| = 24 \\text{ square units}', 'None', 'None');


// 4. Surface Areas & Volumes: Frustum of a Cone (RD Sharma Ex 20.3)
insertTopic.run(
  'vol-frustum-cone',
  'surface-areas-and-volumes',
  'Frustum of a Cone',
  'Calculating the volume, curved surface area, and total surface area of a sliced cone.',
  'Mathematics > Surface Areas & Volumes > Frustum of a Cone'
);
insertConceptNode.run(
  'c-frustum',
  'Frustum of a Cone',
  'Everyday Analogy: Think of a standard steel drinking glass or a bucket. It is a cone cut parallel to its base — a frustum!',
  '{"volume": "V = \\\\frac{1}{3}\\\\pi h (r_1^2 + r_2^2 + r_1 r_2)"}'
);
insertConceptEdge.run('edge-frustum', 'surface-areas-and-volumes-c-0', 'c-frustum', 'EXTENSION_OF');
insertProblem.run(
  'p-rd-frustum-1',
  'vol-frustum-cone',
  'RD_SHARMA',
  'Chapter 20, Ex 20.3',
  8,
  'A drinking glass is in the shape of a frustum of a cone of height 14 cm. The diameters of its two circular ends are 4 cm and 2 cm. Find the capacity of the glass.',
  'h = 14, \\quad d_1 = 4, \\quad d_2 = 2',
  'MEDIUM',
  'c-frustum'
);
insertSolution.run('s-rd-frustum-1-s1', 'p-rd-frustum-1', 1,
  'Identify radii from diameters. Upper radius r1 = 4 / 2 = 2 cm, lower radius r2 = 2 / 2 = 1 cm.',
  'r_1 = 2\\text{ cm}, \\quad r_2 = 1\\text{ cm}', 'r = d/2', 'None');
insertSolution.run('s-rd-frustum-1-s2', 'p-rd-frustum-1', 2,
  'Apply the volume formula for the frustum of a cone.',
  'V = \\frac{1}{3} \\pi h (r_1^2 + r_2^2 + r_1 r_2)', 'Frustum Volume Formula', 'None');
insertSolution.run('s-rd-frustum-1-s3', 'p-rd-frustum-1', 3,
  'Substitute given values: h=14, r1=2, r2=1, pi = 22/7.',
  'V = \\frac{1}{3} \\times \\frac{22}{7} \\times 14 \\times (2^2 + 1^2 + 2 \\times 1)', 'None', 'None');
insertSolution.run('s-rd-frustum-1-s4', 'p-rd-frustum-1', 4,
  'Simplify calculation.',
  'V = \\frac{44}{3} \\times (4 + 1 + 2) = \\frac{44}{3} \\times 7 = \\frac{308}{3} = 102.67\\text{ cm}^3', 'None', 'None');

console.log('Extensions seeded successfully!');
db.close();
