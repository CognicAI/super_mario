
import React, { useEffect, useState } from 'react';
import { GameState, Question, WheelSegment } from '../types';
import DiceRoll from './DiceRoll';
import SubtopicReveal from './SubtopicReveal';

interface GameUIProps {
  gameState: GameState;
  currentQuestion?: Question;
  currentQuestionIndex?: number;
  onStart: (topic: string, difficulty?: 'easy' | 'medium' | 'hard') => void;
  onPause?: () => void;
  onResume?: () => void;
  feedback: string | null;
  score: number;
  totalQuestions: number;
  lives: number;
  showHint: boolean;
  onToggleHint: () => void;
  showFunFact: boolean;
  onDismissFunFact: () => void;
  difficulty?: 'easy' | 'medium' | 'hard';
  onDifficultyChange: (difficulty: 'easy' | 'medium' | 'hard' | undefined) => void;
  wheelSegments?: WheelSegment[];
  wheelKey?: number;
  onWheelComplete?: (subtopic: string) => void;
  selectedSubtopic?: string;
  showSubtopicReveal?: boolean;
  onSubtopicRevealContinue?: () => void;
  onSpinAgain?: () => void;
  onBack?: () => void;
}

const GameUI: React.FC<GameUIProps> = ({
  gameState,
  currentQuestion,
  currentQuestionIndex = 0,
  onStart,
  onPause,
  onResume,
  feedback,
  score,
  totalQuestions,
  lives,
  showHint,
  onToggleHint,
  showFunFact,
  onDismissFunFact,
  difficulty,
  onDifficultyChange,
  wheelSegments = [],
  wheelKey = 0,
  onWheelComplete,
  selectedSubtopic,
  showSubtopicReveal,
  onSubtopicRevealContinue,
  onSpinAgain,
  onBack
}) => {
  const [topic, setTopic] = React.useState('source to pay');
  const [loadingDots, setLoadingDots] = React.useState(0);
  const [canDismissFunFact, setCanDismissFunFact] = React.useState(false);
  const [remainingTime, setRemainingTime] = React.useState(2);

  // Animated loading dots
  React.useEffect(() => {
    if (gameState === GameState.LOADING) {
      const interval = setInterval(() => {
        setLoadingDots(prev => (prev + 1) % 4);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [gameState]);

  // Fun fact delay timer - 2 seconds before allowing dismissal
  React.useEffect(() => {
    if (showFunFact) {
      setCanDismissFunFact(false);
      setRemainingTime(2);

      // Countdown timer
      const countdownInterval = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Enable dismissal after 2 seconds
      const timer = setTimeout(() => {
        setCanDismissFunFact(true);
      }, 2000);

      return () => {
        clearTimeout(timer);
        clearInterval(countdownInterval);
      };
    }
  }, [showFunFact]);

  // Keyboard handler for fun fact dismissal
  React.useEffect(() => {
    if (showFunFact && canDismissFunFact) {
      const handleKeyPress = (e: KeyboardEvent) => {
        onDismissFunFact();
      };

      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [showFunFact, canDismissFunFact, onDismissFunFact]);

  if (gameState === GameState.MENU) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-12 z-50">
        <h1 className="text-7xl mb-8 text-yellow-400 text-center uppercase leading-relaxed" style={{ WebkitTextStroke: '3px black', paintOrder: 'stroke fill' }}>Super Pay Pay<br></br>Finance Quest</h1>
        <div className="w-full max-w-3xl">
          <div className="flex gap-4 justify-center mb-4">
            <button
              className="flex-1 px-8 py-6 text-xl font-bold rounded border-b-8 bg-yellow-500 text-black border-yellow-700 shadow-lg scale-105 cursor-default"
            >
              BOOKKEEPING - SOURCE TO PAY
            </button>
          </div>
          {/* Difficulty Selector - HIDDEN: Hardcoded to fetch all questions */}
          {/* Uncomment below to re-enable difficulty selection */}
          {/*
          <div className="mb-4">
            <label className="block text-xl mb-2" style={{ WebkitTextStroke: '2px black', paintOrder: 'stroke fill' }}>SELECT DIFFICULTY:</label>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => onDifficultyChange(undefined)}
                className={`px-8 py-4 text-lg font-bold rounded border-b-4 transition-all ${difficulty === undefined
                  ? 'bg-yellow-500 text-black border-yellow-700'
                  : 'bg-gray-600 text-white border-gray-800 hover:bg-gray-500'
                  }`}
              >
                ALL
              </button>
              <button
                onClick={() => onDifficultyChange('easy')}
                className={`px-8 py-4 text-lg font-bold rounded border-b-4 transition-all ${difficulty === 'easy'
                  ? 'bg-green-500 text-black border-green-700'
                  : 'bg-gray-600 text-white border-gray-800 hover:bg-gray-500'
                  }`}
              >
                EASY
              </button>
              <button
                onClick={() => onDifficultyChange('medium')}
                className={`px-8 py-4 text-lg font-bold rounded border-b-4 transition-all ${difficulty === 'medium'
                  ? 'bg-orange-500 text-black border-orange-700'
                  : 'bg-gray-600 text-white border-gray-800 hover:bg-gray-500'
                  }`}
              >
                MEDIUM
              </button>
              <button
                onClick={() => onDifficultyChange('hard')}
                className={`px-8 py-4 text-lg font-bold rounded border-b-4 transition-all ${difficulty === 'hard'
                  ? 'bg-red-500 text-black border-red-700'
                  : 'bg-gray-600 text-white border-gray-800 hover:bg-gray-500'
                  }`}
              >
                HARD
              </button>
            </div>
          </div>
          */}

          <button
            onClick={() => onStart('Source to Pay', undefined)} // Hardcoded to "Source to Pay"
            className="w-full bg-red-600 hover:bg-red-700 text-white p-6 text-3xl border-b-8 border-red-900 active:border-b-0 active:translate-y-2 transition-all"
          >
            START GAME
          </button>
        </div>
        <div className="mt-12 text-center">
          <p className="text-lg text-gray-400 mb-6 animate-pulse">JUMP INTO THE RIGHT BLOCK TO ANSWER</p>
          <p className="text-base text-gray-500">ARROW KEYS TO MOVE & JUMP</p>
        </div>
      </div>
    );
  }

  // Wheel Spinning Screen
  if (gameState === GameState.WHEEL_SPINNING) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-purple-900 to-blue-900 text-white z-50">
        <h1 className="text-6xl mb-8 text-yellow-400 uppercase" style={{ WebkitTextStroke: '3px black', paintOrder: 'stroke fill' }}>
          Roll the Dice!
        </h1>
        <p className="text-2xl mb-8 text-white/80">Let's discover your subtopic!</p>
        {wheelSegments.length > 0 && onWheelComplete && (
          <DiceRoll
            key={wheelKey}
            segments={wheelSegments}
            onSpinComplete={onWheelComplete}
            onBack={onBack}
          />
        )}
        {showSubtopicReveal && selectedSubtopic && onSubtopicRevealContinue && (
          <SubtopicReveal
            subtopic={selectedSubtopic}
            onContinue={onSubtopicRevealContinue}
            onSpinAgain={onSpinAgain}
          />
        )}
      </div>
    );
  }

  if (gameState === GameState.LOADING) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-sky-500 text-white z-50">
        <div className="text-5xl mb-8" style={{ WebkitTextStroke: '2px black', paintOrder: 'stroke fill' }}>LOADING QUESTIONS{'.'.repeat(loadingDots)}</div>
        <div className="flex gap-3 mb-8">
          <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <p className="text-xl text-white/80">Fetching from database...</p>
        <p className="text-sm text-white/60 mt-4">This should be quick!</p>
      </div>
    );
  }

  // Pause Screen (only show if not showing hint)
  if (gameState === GameState.PAUSED && !showHint) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white z-50">
        <h2 className="text-7xl mb-12 text-yellow-400 uppercase" style={{ WebkitTextStroke: '3px black', paintOrder: 'stroke fill' }}>Paused</h2>
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
      <div className="flex items-start text-white text-2xl">
        {/* Left side - Score and Lifelines */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-yellow-300 mb-2 text-xl" style={{ WebkitTextStroke: '2px black', paintOrder: 'stroke fill' }}>SCORE</div>
            <div className="text-2xl" style={{ WebkitTextStroke: '2px black', paintOrder: 'stroke fill' }}>{score.toString().padStart(4, '0')}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl" style={{ WebkitTextStroke: '2px black', paintOrder: 'stroke fill' }}>LIFELINES:{lives}</span>
          </div>
        </div>

        {/* Centered - Question and Hint */}
        <div className="flex-1 flex flex-col items-center justify-start">
          <div className="text-center max-w-3xl w-full">
            <div className="text-yellow-300 mb-3 uppercase text-2xl" style={{ WebkitTextStroke: '2px black', paintOrder: 'stroke fill' }}>QUESTION {currentQuestionIndex + 1}/{totalQuestions}</div>
            <div className="bg-blue-600/80 backdrop-blur-sm p-6 border-4 border-white rounded shadow-lg text-xl leading-8 text-white uppercase" style={{ WebkitTextStroke: '2px black', paintOrder: 'stroke fill' }}>
              {currentQuestion?.text}
            </div>

            {/* Hint Button */}
            {currentQuestion?.hint && !showHint && (
              <button
                onClick={onToggleHint}
                className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 text-lg font-bold rounded border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 transition-all pointer-events-auto uppercase"
              >
                💡 Need a Hint?
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-50">
          <div className={`text-8xl font-bold uppercase ${feedback === 'CORRECT!' ? 'text-green-500' : 'text-red-500'} animate-bounce`} style={{ WebkitTextStroke: '4px black', paintOrder: 'stroke fill' }}>
            {feedback}
          </div>
        </div>
      )}

      {/* Fullscreen Hint Display */}
      {showHint && currentQuestion?.hint && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white z-50 pointer-events-auto">
          <div className="max-w-4xl p-12 text-center">
            <div className="text-6xl mb-8">💡</div>
            <h2 className="text-5xl mb-8 text-yellow-400 uppercase">Hint</h2>
            <div className="bg-yellow-100 text-black p-10 rounded-lg shadow-2xl text-3xl leading-relaxed mb-12">
              {currentQuestion.hint}
            </div>
            <button
              onClick={onToggleHint}
              className="bg-green-600 hover:bg-green-700 text-white px-12 py-6 text-3xl border-b-8 border-green-900 active:border-b-0 active:translate-y-2 transition-all uppercase"
            >
              Close & Resume (ESC)
            </button>
          </div>
        </div>
      )}

      {/* Fun Fact Display - Click or Press Any Key to Dismiss */}
      {showFunFact && currentQuestion?.funFact && (
        <div
          onClick={() => canDismissFunFact && onDismissFunFact()}
          className={`absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50 pointer-events-auto ${canDismissFunFact ? 'cursor-pointer' : 'cursor-wait'}`}
        >
          <div className="max-w-5xl p-12 text-center">
            <div className="text-8xl mb-6 animate-bounce">🎉</div>
            <h2 className="text-6xl mb-8 text-yellow-400 uppercase">Fun Fact!</h2>
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-12 rounded-lg shadow-2xl border-4 border-white text-3xl leading-relaxed mb-8">
              {currentQuestion.funFact}
            </div>
            {canDismissFunFact ? (
              <p className="text-2xl text-gray-300 animate-pulse">Click anywhere or press any key to continue</p>
            ) : (
              <p className="text-2xl text-yellow-300 font-bold">Please wait... {remainingTime}s</p>
            )}
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === GameState.GAMEOVER && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center pointer-events-auto z-[100]">
          <h2 className="text-8xl text-red-600 mb-16 uppercase animate-pulse" style={{ WebkitTextStroke: '4px black', paintOrder: 'stroke fill' }}>Game Over</h2>
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
          <h2 className="text-7xl text-yellow-400 mb-8 uppercase" style={{ WebkitTextStroke: '3px black', paintOrder: 'stroke fill' }}>QUEST COMPLETE!</h2>
          <p className="text-white mb-12 text-2xl">CHALLENGE CONQUERED!</p>
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
