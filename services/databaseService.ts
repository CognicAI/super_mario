import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Question, QuestionRow } from '../types';
import { SOURCE_TO_PAY_SUBTOPICS } from '../subtopicConfig';

// Initialize Supabase client
// Note: Add these to your .env.local file:
// VITE_SUPABASE_URL=your-project-url
// VITE_SUPABASE_ANON_KEY=your-anon-key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

// Initialize Supabase client (lazy initialization)
function getSupabaseClient(): SupabaseClient {
    if (!supabase) {
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
        }
        supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
    return supabase;
}

/**
 * Normalize subtopic name to match canonical configuration
 */
function normalizeSubtopic(subtopic: string | null): string | undefined {
    if (!subtopic) return undefined;

    const trimmed = subtopic.trim();
    const normalizedLower = trimmed.toLowerCase();

    // Check against Source to Pay subtopics (case-insensitive)
    const match = SOURCE_TO_PAY_SUBTOPICS.find(
        st => st.name.trim().toLowerCase() === normalizedLower
    );

    if (match) {
        return match.name;
    }

    return trimmed;
}

/**
 * Convert database row to Question interface
 */
function rowToQuestion(row: QuestionRow): Question {
    const options = [row.option_a, row.option_b, row.option_c, row.option_d];

    // Map letter (A/B/C/D) to actual option text
    const correctAnswerMap: Record<string, string> = {
        'A': row.option_a,
        'B': row.option_b,
        'C': row.option_c,
        'D': row.option_d
    };

    return {
        id: row.id,
        text: row.text,
        options: options,
        correctAnswer: correctAnswerMap[row.correct_answer] || row.option_a, // Fallback to first option
        hint: row.hint || undefined,
        funFact: row.fun_fact || undefined,
        topic: row.topic,
        subtopic: normalizeSubtopic(row.subtopic),
        difficulty: row.difficulty || undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
    };
}

/**
 * Convert Question interface to database row format
 */
function questionToRow(question: Question, topic: string = 'general'): Partial<QuestionRow> {
    if (question.options.length !== 4) {
        throw new Error('Question must have exactly 4 options');
    }

    // Find which option matches the correct answer and convert to letter
    const correctAnswerIndex = question.options.findIndex(opt => opt === question.correctAnswer);
    const correctAnswerLetter = ['A', 'B', 'C', 'D'][correctAnswerIndex] || 'A';

    return {
        text: question.text,
        option_a: question.options[0],
        option_b: question.options[1],
        option_c: question.options[2],
        option_d: question.options[3],
        correct_answer: correctAnswerLetter as 'A' | 'B' | 'C' | 'D',
        hint: question.hint || null,
        fun_fact: question.funFact || null,
        topic: question.topic || topic,
        subtopic: question.subtopic || null,
        difficulty: question.difficulty || null
    };
}

/**
 * Save multiple questions to the database
 */
export async function saveQuestions(questions: Question[], topic: string = 'general'): Promise<void> {
    const client = getSupabaseClient();

    const rows = questions.map(q => questionToRow(q, topic));

    const { error } = await client
        .from('questions_1')
        .insert(rows);

    if (error) {
        console.error('Error saving questions:', error);
        throw new Error(`Failed to save questions: ${error.message}`);
    }
}

/**
 * Get questions by topic
 */
export async function getQuestionsByTopic(topic: string, limit?: number): Promise<Question[]> {
    const client = getSupabaseClient();

    let query = client
        .from('questions_1')
        .select('*')
        .eq('topic', topic)
        .order('created_at', { ascending: false });

    if (limit) {
        query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching questions:', error);
        throw new Error(`Failed to fetch questions: ${error.message}`);
    }

    return (data as QuestionRow[]).map(rowToQuestion);
}

/**
 * Get random questions
 */
export async function getRandomQuestions(count: number, topic?: string, difficulty?: 'easy' | 'medium' | 'hard', subtopic?: string): Promise<Question[]> {
    const client = getSupabaseClient();

    // Note: Supabase doesn't have a built-in RANDOM() function in the query builder
    // We'll fetch more questions and randomly select from them
    const fetchCount = Math.max(count * 3, 20); // Fetch 3x more to randomize from

    let query = client
        .from('questions_1')
        .select('*')
        .limit(fetchCount);

    if (topic) {
        query = query.eq('topic', topic);
    }

    if (difficulty) {
        query = query.eq('difficulty', difficulty);
    }

    if (subtopic) {
        query = query.eq('subtopic', subtopic);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching random questions:', error);
        throw new Error(`Failed to fetch random questions: ${error.message}`);
    }

    // Randomly shuffle and take the requested count
    const shuffled = (data as QuestionRow[])
        .sort(() => Math.random() - 0.5)
        .slice(0, count);

    return shuffled.map(rowToQuestion);
}

/**
 * Update a question
 */
export async function updateQuestion(id: number, updates: Partial<Question>): Promise<void> {
    const client = getSupabaseClient();

    const row: any = {};

    if (updates.text !== undefined) row.text = updates.text;
    if (updates.options !== undefined) {
        if (updates.options.length !== 4) {
            throw new Error('Question must have exactly 4 options');
        }
        row.option_a = updates.options[0];
        row.option_b = updates.options[1];
        row.option_c = updates.options[2];
        row.option_d = updates.options[3];
    }
    if (updates.correctAnswer !== undefined) row.correct_answer = updates.correctAnswer;
    if (updates.hint !== undefined) row.hint = updates.hint;
    if (updates.funFact !== undefined) row.fun_fact = updates.funFact;
    if (updates.topic !== undefined) row.topic = updates.topic;
    if (updates.difficulty !== undefined) row.difficulty = updates.difficulty;

    const { error } = await client
        .from('questions_1')
        .update(row)
        .eq('id', id);

    if (error) {
        console.error('Error updating question:', error);
        throw new Error(`Failed to update question: ${error.message}`);
    }
}

/**
 * Delete a question
 */
export async function deleteQuestion(id: number): Promise<void> {
    const client = getSupabaseClient();

    const { error } = await client
        .from('questions_1')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting question:', error);
        throw new Error(`Failed to delete question: ${error.message}`);
    }
}

/**
 * Get question by ID
 */
export async function getQuestionById(id: number): Promise<Question | null> {
    const client = getSupabaseClient();

    const { data, error } = await client
        .from('questions_1')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // Not found
            return null;
        }
        console.error('Error fetching question:', error);
        throw new Error(`Failed to fetch question: ${error.message}`);
    }

    return rowToQuestion(data as QuestionRow);
}

/**
 * Get all topics
 */
export async function getAllTopics(): Promise<string[]> {
    const client = getSupabaseClient();

    const { data, error } = await client
        .from('questions_1')
        .select('topic')
        .order('topic');

    if (error) {
        console.error('Error fetching topics:', error);
        throw new Error(`Failed to fetch topics: ${error.message}`);
    }

    // Get unique topics
    const topics = [...new Set((data as { topic: string }[]).map(row => row.topic))];
    return topics;
}

/**
 * Get question count by topic
 */
export async function getQuestionCountByTopic(topic: string): Promise<number> {
    const client = getSupabaseClient();

    const { count, error } = await client
        .from('questions_1')
        .select('*', { count: 'exact', head: true })
        .eq('topic', topic);

    if (error) {
        console.error('Error counting questions:', error);
        throw new Error(`Failed to count questions: ${error.message}`);
    }

    return count || 0;
}
