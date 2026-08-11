const { db } = require('./database');

/**
 * Retrieves the full hierarchical syllabus tree structure
 */
function getSyllabusTree(boardFilter) {
  let chaptersQuery = 'SELECT * FROM chapters';
  let chaptersParams = [];
  if (boardFilter) {
    chaptersQuery += ' WHERE board_source = ?';
    chaptersParams.push(boardFilter);
  }
  
  const chapters = db.prepare(chaptersQuery).all(...chaptersParams);
  const topics = db.prepare('SELECT id, chapter_id, name, description, document_tree_path FROM topics').all();

  const tree = chapters.map(ch => {
    const chTopics = topics.filter(t => t.chapter_id === ch.id).map(t => {
      return {
        id: t.id,
        name: t.name,
        description: t.description,
        document_tree_path: t.document_tree_path,
        problems: []
      };
    });

    return {
      id: ch.id,
      subject_id: ch.subject_id,
      name: ch.name,
      summary: ch.summary,
      board_source: ch.board_source,
      topics: chTopics
    };
  });

  return tree;
}

/**
 * Searches the database for matching topics, problems, or concept nodes
 */
function searchHybrid(queryText) {
  const normQuery = `%${queryText}%`;
  
  // Search problems
  const problems = db.prepare(`
    SELECT p.*, t.name as topic_name, c.name as chapter_name, c.board_source
    FROM problems p
    JOIN topics t ON p.topic_id = t.id
    JOIN chapters c ON t.chapter_id = c.id
    WHERE p.question_text LIKE ? OR p.exercise_label LIKE ?
  `).all(normQuery, normQuery);

  // Search topics
  const topics = db.prepare(`
    SELECT t.*, c.name as chapter_name, c.board_source
    FROM topics t
    JOIN chapters c ON t.chapter_id = c.id
    WHERE t.name LIKE ? OR t.description LIKE ?
  `).all(normQuery, normQuery);

  // Search concepts
  const concepts = db.prepare(`
    SELECT * FROM concept_nodes
    WHERE name LIKE ? OR description LIKE ?
  `).all(normQuery, normQuery);

  return {
    problems,
    topics,
    concepts
  };
}

/**
 * Resolves a specific concept and its related nodes in the knowledge graph
 */
function resolveConceptGraph(conceptId) {
  const concept = db.prepare('SELECT * FROM concept_nodes WHERE id = ?').get(conceptId);
  if (!concept) return null;

  // Find related edges
  const edges = db.prepare(`
    SELECT ce.*, source.name as source_name, target.name as target_name
    FROM concept_edges ce
    JOIN concept_nodes source ON ce.source_concept_id = source.id
    JOIN concept_nodes target ON ce.target_concept_id = target.id
    WHERE ce.source_concept_id = ? OR ce.target_concept_id = ?
  `).all(conceptId, conceptId);

  // Find all related concept details
  const relatedNodeIds = new Set();
  edges.forEach(edge => {
    relatedNodeIds.add(edge.source_concept_id);
    relatedNodeIds.add(edge.target_concept_id);
  });
  
  let relatedNodes = [];
  if (relatedNodeIds.size > 0) {
    const placeholders = Array.from(relatedNodeIds).map(() => '?').join(',');
    relatedNodes = db.prepare(`SELECT * FROM concept_nodes WHERE id IN (${placeholders})`).all(...Array.from(relatedNodeIds));
  } else {
    relatedNodes = [concept];
  }

  return {
    concept,
    edges,
    nodes: relatedNodes
  };
}

/**
 * Gets detailed step-by-step solution for a problem, including media attachments
 */
function getProblemDetails(problemId) {
  const problem = db.prepare(`
    SELECT p.*, t.name as topic_name, c.name as chapter_name, c.board_source
    FROM problems p
    JOIN topics t ON p.topic_id = t.id
    JOIN chapters c ON t.chapter_id = c.id
    WHERE p.id = ?
  `).get(problemId);

  if (!problem) return null;

  const steps = db.prepare('SELECT * FROM solutions WHERE problem_id = ? ORDER BY step_number ASC').all(problemId);
  const media = db.prepare('SELECT * FROM media_attachments WHERE target_id = ? OR target_id = ?').all(problemId, problem.topic_id);

  return {
    problem,
    steps,
    media
  };
}

/**
 * Retrieves a single chapter with its real topics and problems (with step
 * solutions) from the database. Used to scaffold subject-aware lessons for
 * un-authored chapters.
 */
function getChapterById(chapterId) {
  if (!chapterId) return null;
  const chapter = db.prepare('SELECT * FROM chapters WHERE id = ?').get(chapterId);
  if (!chapter) return null;

  const topics = db.prepare('SELECT id, name, description, document_tree_path FROM topics WHERE chapter_id = ?').all(chapterId);
  const problems = db.prepare('SELECT * FROM problems WHERE topic_id IN (SELECT id FROM topics WHERE chapter_id = ?) ORDER BY question_number ASC').all(chapterId);

  return {
    id: chapter.id,
    name: chapter.name,
    summary: chapter.summary,
    subject_id: chapter.subject_id,
    board_source: chapter.board_source,
    topics,
    problems
  };
}

module.exports = {
  getSyllabusTree,
  searchHybrid,
  resolveConceptGraph,
  getProblemDetails,
  getChapterById
};
