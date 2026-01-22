-- Migration: Add subtopic column to questions table
-- Created: 2026-01-22

-- Add subtopic column
ALTER TABLE questions_1 ADD COLUMN subtopic VARCHAR(100);

-- Create index on subtopic for performance
CREATE INDEX idx_questions_1_subtopic ON questions_1(subtopic);

-- Update composite index to include subtopic
DROP INDEX IF EXISTS idx_questions_1_topic_difficulty;
CREATE INDEX idx_questions_1_topic_subtopic_difficulty ON questions_1(topic, subtopic, difficulty);

-- Add comment
COMMENT ON COLUMN questions_1.subtopic IS 'Question subtopic within the main topic (e.g., "Creating PO", "Sourcing and selecting Suppliers")';
