
import React from 'react';
import { GameState, Question } from '../types';

interface GameUIProps {
  gameState: GameState;
  currentQuestion?: Question;
  currentQuestionIndex?: number;
  onStart: (topic: string) => void;
  feedback: string | null;
  score: number;
  totalQuestions: number;
  lives: number;
}

const GameUI: React.FC<GameUIProps> = ({ 
  gameState, 
  currentQuestion, 
  currentQuestionIndex = 0,
  onStart, 
  feedback, 
  score, 
  totalQuestions,
  lives
}) => {
  const [topic, setTopic] = React.useState('General Science');

  if (gameState === GameState.MENU) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-6 z-50">
        <h1 className="text-4xl mb-8 text-yellow-400 text-center uppercase leading-relaxed">Super Mario<br/>Quiz Quest</h1>
        <div className="w-full max-w-md">
          <label className="block text-xs mb-2">ENTER A TOPIC:</label>
          <input 
            type="text" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-white text-black p-4 mb-6 font-inherit outline-none border-4 border-yellow-500"
          />
          <button 
            onClick={() => onStart(topic)}
            className="w-full bg-red-600 hover:bg-red-700 text-white p-4 text-xl border-b-8 border-red-900 active:border-b-0 active:translate-y-2 transition-all"
          >
            START GAME
          </button>
        </div>
        <div className="mt-12 text-center">
            <p className="text-[10px] text-gray-400 mb-4 animate-pulse">JUMP INTO THE RIGHT BLOCK TO ANSWER</p>
            <p className="text-[8px] text-gray-500">ARROW KEYS TO MOVE & JUMP</p>
        </div>
      </div>
    );
  }

  if (gameState === GameState.LOADING) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-sky-500 text-white z-50">
        <div className="text-2xl animate-pulse">GENERATING LEVEL...</div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none p-4">
      {/* HUD */}
      <div className="flex justify-between items-start text-white text-sm">
        <div className="flex flex-col gap-2">
          <div>
            <div className="text-yellow-300 mb-1">MARIO</div>
            <div>{score.toString().padStart(6, '0')}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-500 text-lg">❤</span>
            <span>x{lives}</span>
          </div>
        </div>
        <div className="text-center max-w-lg">
          <div className="text-yellow-300 mb-1 uppercase">QUESTION {currentQuestionIndex + 1}/{totalQuestions}</div>
          <div className="bg-white/10 backdrop-blur-sm p-4 border-2 border-white rounded shadow-lg text-[10px] leading-5">
            {currentQuestion?.text}
          </div>
        </div>
        <div>
          <div className="text-yellow-300 mb-1">WORLD</div>
          <div>1-1</div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
          <div className={`text-4xl font-bold uppercase ${feedback === 'CORRECT!' ? 'text-green-500' : 'text-red-500'} drop-shadow-lg animate-bounce`}>
            {feedback}
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === GameState.GAMEOVER && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center pointer-events-auto z-[100]">
          <h2 className="text-5xl text-red-600 mb-8 uppercase animate-pulse">Game Over</h2>
          <button 
            onClick={() => window.location.reload()}
            className="bg-white text-black p-4 text-xl border-b-8 border-gray-400 active:border-b-0 active:translate-y-2 transition-all uppercase"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Success Screen */}
      {gameState === GameState.SUCCESS && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center pointer-events-auto z-[100]">
          <h2 className="text-4xl text-yellow-400 mb-4 uppercase">COURSE CLEAR!</h2>
          <p className="text-white mb-8">YOU REACHED THE CASTLE!</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-green-600 p-4 text-white border-b-8 border-green-900 active:border-b-0 active:translate-y-2 transition-all uppercase"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default GameUI;
