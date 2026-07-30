-- Subjects table (e.g., Mathematics, Science)
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
);

-- Chapters table mapping NCERT, AP State Board, and TS State Board
CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    name TEXT NOT NULL,
    summary TEXT,
    board_source TEXT NOT NULL, -- 'CBSE_NCERT', 'AP_BOARD', 'TS_BOARD'
    academic_year TEXT DEFAULT '2026-27',
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- Topics table representing the syllabus index (Google Docs tree equivalent)
CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    chapter_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    document_tree_path TEXT, -- Hierarchical path: "Real Numbers > Fundamental Theorem of Arithmetic"
    FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);

-- Concept Nodes (for Knowledge Graph / Graph RAG)
CREATE TABLE IF NOT EXISTS concept_nodes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    formulas TEXT -- JSON string listing relevant LaTeX formulas
);

-- Concept Edges mapping prerequisite and related links
CREATE TABLE IF NOT EXISTS concept_edges (
    id TEXT PRIMARY KEY,
    source_concept_id TEXT NOT NULL,
    target_concept_id TEXT NOT NULL,
    relation_type TEXT NOT NULL, -- 'PREREQUISITE', 'RELATED_TO', 'EXTENSION_OF'
    FOREIGN KEY (source_concept_id) REFERENCES concept_nodes(id),
    FOREIGN KEY (target_concept_id) REFERENCES concept_nodes(id)
);

-- Reference Textbooks / Sources
CREATE TABLE IF NOT EXISTS problems (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL,
    book_source TEXT NOT NULL, -- 'NCERT', 'RD_SHARMA', 'RS_AGARWAL', 'MODEL_PAPER'
    exercise_label TEXT NOT NULL, -- e.g., 'Exercise 1.1', 'Chapter Test'
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_latex TEXT,
    difficulty TEXT DEFAULT 'MEDIUM', -- 'EASY', 'MEDIUM', 'HARD', 'COMPETITIVE'
    concept_id TEXT,
    FOREIGN KEY (topic_id) REFERENCES topics(id),
    FOREIGN KEY (concept_id) REFERENCES concept_nodes(id)
);

-- Detailed step-by-step solutions
CREATE TABLE IF NOT EXISTS solutions (
    id TEXT PRIMARY KEY,
    problem_id TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    step_explanation TEXT NOT NULL,
    step_latex TEXT, -- LaTeX mathematical steps
    formula_used TEXT, -- Reference to formulas used
    vedic_shortcut_applied TEXT, -- Description of Vedic Math shortcut if applicable
    FOREIGN KEY (problem_id) REFERENCES problems(id)
);

-- Media attachments (mind maps, flow charts, infographics, concept videos)
CREATE TABLE IF NOT EXISTS media_attachments (
    id TEXT PRIMARY KEY,
    target_id TEXT NOT NULL, -- references topic_id, chapter_id, or problem_id
    target_type TEXT NOT NULL, -- 'TOPIC', 'CHAPTER', 'PROBLEM'
    media_type TEXT NOT NULL, -- 'VIDEO', 'MIND_MAP', 'FLOW_CHART', 'INFOGRAPHIC'
    title TEXT NOT NULL,
    media_url TEXT NOT NULL,
    thumbnail_url TEXT
);
-- Vector embeddings for RAG (optional)
CREATE TABLE IF NOT EXISTS vectors (
    id TEXT PRIMARY KEY,
    embedding BLOB NOT NULL
);
