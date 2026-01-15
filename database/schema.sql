-- ============================================================================
-- Super Mario Quiz Quest - Database Schema
-- ============================================================================
-- Database: PostgreSQL (Supabase)
-- Design: Single Table (Option 1)
-- Purpose: Store quiz questions with options, hints, and fun facts
-- ============================================================================

-- Drop table if exists (for development/testing)
-- DROP TABLE IF EXISTS questions CASCADE;

-- ============================================================================
-- Main Questions Table
-- ============================================================================
CREATE TABLE questions (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Question Content
    text TEXT NOT NULL,
    
    -- Answer Options (4 options required)
    option_a VARCHAR(500) NOT NULL,
    option_b VARCHAR(500) NOT NULL,
    option_c VARCHAR(500) NOT NULL,
    option_d VARCHAR(500) NOT NULL,
    
    -- Correct Answer (must be A, B, C, or D)
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    
    -- Additional Content
    hint TEXT,
    fun_fact TEXT,
    
    -- Categorization
    topic VARCHAR(100) NOT NULL DEFAULT 'general',
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Index for topic-based queries (most common filter)
CREATE INDEX idx_questions_topic ON questions(topic);

-- Index for difficulty filtering
CREATE INDEX idx_questions_difficulty ON questions(difficulty);

-- Composite index for topic + difficulty queries
CREATE INDEX idx_questions_topic_difficulty ON questions(topic, difficulty);

-- Index for created_at (for sorting by newest/oldest)
CREATE INDEX idx_questions_created_at ON questions(created_at DESC);

-- ============================================================================
-- Trigger for Auto-updating updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_questions_updated_at 
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Row Level Security (RLS) for Supabase
-- ============================================================================
-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (anyone can view questions)
CREATE POLICY "Questions are viewable by everyone"
    ON questions FOR SELECT
    USING (true);

-- Policy: Allow authenticated users to insert questions
CREATE POLICY "Authenticated users can insert questions"
    ON questions FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to update their own questions
-- Note: You may want to add a user_id column if you need per-user ownership
CREATE POLICY "Authenticated users can update questions"
    ON questions FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to delete questions
CREATE POLICY "Authenticated users can delete questions"
    ON questions FOR DELETE
    USING (auth.role() = 'authenticated');

-- ============================================================================
-- Sample Data (for testing)
-- ============================================================================
INSERT INTO questions (text, option_a, option_b, option_c, option_d, correct_answer, hint, fun_fact, topic, difficulty)
VALUES 
(
    'What is the name of Mario''s brother?',
    'Wario',
    'Luigi',
    'Waluigi',
    'Toad',
    'B',
    'He wears green and is often seen as the sidekick.',
    'Luigi was originally introduced in the arcade game Mario Bros. in 1983 as a palette swap of Mario.',
    'super-mario',
    'easy'
),
(
    'In which year was the original Super Mario Bros. released?',
    '1983',
    '1985',
    '1987',
    '1990',
    'B',
    'It was released in the mid-1980s for the NES.',
    'Super Mario Bros. saved the video game industry after the 1983 crash and sold over 40 million copies.',
    'super-mario',
    'medium'
),
(
    'What power-up allows Mario to throw fireballs?',
    'Super Mushroom',
    'Fire Flower',
    'Super Star',
    'Cape Feather',
    'B',
    'This power-up is red and white with a flower shape.',
    'The Fire Flower first appeared in Super Mario Bros. and has become one of the most iconic power-ups in gaming.',
    'super-mario',
    'easy'
);

-- ============================================================================
-- Useful Queries (Comments for reference)
-- ============================================================================

-- Get all questions for a specific topic
-- SELECT * FROM questions WHERE topic = 'super-mario';

-- Get random questions for a quiz
-- SELECT * FROM questions WHERE topic = 'super-mario' ORDER BY RANDOM() LIMIT 5;

-- Get questions by difficulty
-- SELECT * FROM questions WHERE difficulty = 'hard' AND topic = 'super-mario';

-- Get questions with hints
-- SELECT * FROM questions WHERE hint IS NOT NULL;

-- Count questions by topic
-- SELECT topic, COUNT(*) as question_count FROM questions GROUP BY topic;

-- Get recently added questions
-- SELECT * FROM questions ORDER BY created_at DESC LIMIT 10;
