
export interface Question {
  id: number;
  text: string;
  options: string[];  // Array of 4 options [A, B, C, D]
  correctAnswer: string;  // 'A', 'B', 'C', or 'D'
  hint?: string;  // Optional hint for the question
  funFact?: string;  // Fun fact about the question/answer
  topic?: string;  // Question topic/category (e.g., 'super-mario', 'geography')
  difficulty?: 'easy' | 'medium' | 'hard';  // Difficulty level
  createdAt?: Date;  // Creation timestamp
  updatedAt?: Date;  // Last update timestamp
}

// Database row type (matches PostgreSQL schema exactly)
export interface QuestionRow {
  id: number;
  text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  hint: string | null;
  fun_fact: string | null;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  created_at: string;
  updated_at: string;
}

export interface Vector2D {
  x: number;
  y: number;
}

export enum GameState {
  MENU = 'MENU',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAMEOVER = 'GAMEOVER',
  SUCCESS = 'SUCCESS'
}

export interface Entity {
  pos: Vector2D;
  vel: Vector2D;
  width: number;
  height: number;
}

export interface Block extends Entity {
  type: 'QUESTION' | 'FLOOR' | 'CASTLE' | 'BRICK' | 'HIDDEN' | 'PIPE';
  label?: string;
  isHit?: boolean;
}

export interface Enemy extends Entity {
  type: 'GOOMBA';
  isDead: boolean;
  deadTimer: number;
  facing: 1 | -1;
}
