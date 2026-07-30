const { getSyllabusTree, searchHybrid, resolveConceptGraph, getProblemDetails } = require('../lib/ragService');

console.log('Testing RAG and Database service...');

// 1. Get syllabus tree
const tree = getSyllabusTree();
if (tree.length > 0) {
  console.log('✓ Syllabus tree retrieved. Chapter count:', tree.length);
} else {
  console.error('✗ Failed to retrieve syllabus tree');
  process.exit(1);
}

// 2. Search
const searchResults = searchHybrid('Linear');
if (searchResults.problems.length > 0 || searchResults.topics.length > 0 || searchResults.concepts.length > 0) {
  console.log('✓ Hybrid search for "Linear" succeeded. Found problems:', searchResults.problems.length);
} else {
  console.error('✗ Hybrid search returned zero results');
  process.exit(1);
}

// 3. Resolve Concept Graph
const conceptGraph = resolveConceptGraph('c-lin-eq-2var');
if (conceptGraph && conceptGraph.edges.length > 0) {
  console.log('✓ Concept Graph resolved for c-lin-eq-2var. Edges:', conceptGraph.edges.length);
} else {
  console.error('✗ Concept Graph failed to resolve');
  process.exit(1);
}

// 4. Get Problem Details
const problem = getProblemDetails('p-ncert-3.2-1');
if (problem && problem.steps.length > 0) {
  console.log('✓ Problem details and solution steps retrieved for p-ncert-3.2-1. Steps:', problem.steps.length);
} else {
  console.error('✗ Problem details failed to retrieve');
  process.exit(1);
}

console.log('All tests passed successfully!');
