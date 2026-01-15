
import React from 'react';
import { GameState, Question } from '../types';

interface GameUIProps {
  gameState: GameState;
  currentQuestion?: Question;
  currentQuestionIndex?: number;
  onStart: (topic: string) => void;
  onStartOffline: () => void;
  onPause?: () => void;
  onResume?: () => void;
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
  onStartOffline,
  onPause,
  onResume,
  feedback,
  score,
  totalQuestions,
  lives
}) => {
  const [topic, setTopic] = React.useState('Procure to pay process');
  const [loadingDots, setLoadingDots] = React.useState(0);

  // Animated loading dots
  React.useEffect(() => {
    if (gameState === GameState.LOADING) {
      const interval = setInterval(() => {
        setLoadingDots(prev => (prev + 1) % 4);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [gameState]);

  if (gameState === GameState.MENU) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-12 z-50">
        <h1 className="text-7xl mb-16 text-yellow-400 text-center uppercase leading-relaxed">Super Mario<br />Quiz Quest</h1>
        <div className="w-full max-w-3xl">
          <label className="block text-xl mb-4">ENTER A TOPIC:</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-white text-black p-6 mb-10 font-inherit outline-none border-4 border-yellow-500 text-xl"
          />
          <button
            onClick={() => onStart(topic)}
            className="w-full bg-red-600 hover:bg-red-700 text-white p-6 text-3xl border-b-8 border-red-900 active:border-b-0 active:translate-y-2 transition-all mb-6"
          >
            START GAME
          </button>
          <button
            onClick={onStartOffline}
            className="w-full bg-green-600 hover:bg-green-700 text-white p-5 text-xl border-b-8 border-green-900 active:border-b-0 active:translate-y-2 transition-all"
          >
            🎮 OFFLINE MODE (DEV)
          </button>
        </div>
        <div className="mt-20 text-center">
          <p className="text-lg text-gray-400 mb-6 animate-pulse">JUMP INTO THE RIGHT BLOCK TO ANSWER</p>
          <p className="text-base text-gray-500">ARROW KEYS TO MOVE & JUMP</p>
        </div>
      </div>
    );
  }

  if (gameState === GameState.LOADING) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-sky-500 text-white z-50">
        <div className="text-5xl mb-8">GENERATING LEVEL{'.'.repeat(loadingDots)}</div>
        <div className="flex gap-3 mb-8">
          <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <p className="text-xl text-white/80">Connecting to AI...</p>
        <p className="text-sm text-white/60 mt-4">This may take a few seconds</p>
      </div>
    );
  }

  // Pause Screen
  if (gameState === GameState.PAUSED) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white z-50">
        <h2 className="text-7xl mb-12 text-yellow-400 uppercase">Paused</h2>
        <div className="flex flex-col gap-6">
          <button
            onClick={onResume}
            className="bg-green-600 hover:bg-green-700 text-white px-12 py-6 text-3xl border-b-8 border-green-900 active:border-b-0 active:translate-y-2 transition-all uppercase"
          >
            Resume (ESC)
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-12 py-6 text-3xl border-b-8 border-red-900 active:border-b-0 active:translate-y-2 transition-all uppercase"
          >
            Quit to Menu
          </button>
        </div>
        <p className="text-gray-400 mt-12 text-lg">Press ESC or P to resume</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none p-8">
      {/* HUD */}
      <div className="flex justify-between items-start text-white text-2xl">
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-yellow-300 mb-2 text-xl">MARIO</div>
            <div className="text-2xl">{score.toString().padStart(6, '0')}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-red-500 text-3xl">❤</span>
            <span className="text-2xl">x{lives}</span>
          </div>
        </div>
        <div className="text-center max-w-3xl">
          <div className="text-yellow-300 mb-3 uppercase text-2xl">QUESTION {currentQuestionIndex + 1}/{totalQuestions}</div>
          <div className="bg-white/10 backdrop-blur-sm p-6 border-2 border-white rounded shadow-lg text-xl leading-7">
            {currentQuestion?.text}
          </div>
        </div>
        <div>
          <div className="text-yellow-300 mb-2 text-xl">WORLD</div>
          <div className="text-2xl">1-1</div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
          <div className={`text-8xl font-bold uppercase ${feedback === 'CORRECT!' ? 'text-green-500' : 'text-red-500'} drop-shadow-lg animate-bounce`}>
            {feedback}
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === GameState.GAMEOVER && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center pointer-events-auto z-[100]">
          <h2 className="text-8xl text-red-600 mb-16 uppercase animate-pulse">Game Over</h2>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-black p-6 text-3xl border-b-8 border-gray-400 active:border-b-0 active:translate-y-2 transition-all uppercase"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Success Screen */}
      {gameState === GameState.SUCCESS && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center pointer-events-auto z-[100]">
          <h2 className="text-7xl text-yellow-400 mb-8 uppercase">COURSE CLEAR!</h2>
          <p className="text-white mb-12 text-2xl">YOU REACHED THE CASTLE!</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 p-6 text-white text-3xl border-b-8 border-green-900 active:border-b-0 active:translate-y-2 transition-all uppercase"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default GameUI;
