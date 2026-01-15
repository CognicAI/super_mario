
export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
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
  type: 'QUESTION' | 'FLOOR' | 'CASTLE' | 'BRICK' | 'HIDDEN';
  label?: string;
  isHit?: boolean;
}

export interface Enemy extends Entity {
  type: 'GOOMBA';
  isDead: boolean;
  deadTimer: number;
  facing: 1 | -1;
}
