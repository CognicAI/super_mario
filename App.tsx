
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Question, Block, Enemy, Vector2D } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, COLORS, GRAVITY, JUMP_STRENGTH, MOVE_SPEED } from './constants';
import { fetchQuestions } from './services/geminiService';
import { audioService } from './services/audioService';
import GameUI from './components/GameUI';
import { drawPlayer } from './renderers/PlayerRenderer';
import { drawEnemy } from './renderers/EnemyRenderer';
import { drawEnvironment } from './renderers/EnvironmentRenderer';
import { useInput } from './hooks/useInput';

const COYOTE_TIME = 150; // ms
const ENEMY_SPEED = 2.0;
const INITIAL_LIVES = 3;
const INVULNERABILITY_TIME = 1000;


const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [lives, setLives] = useState(INITIAL_LIVES);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(undefined);
  const lastTimeRef = useRef<number>(0);

  // State refs for game loop
  const gameStateRef = useRef(gameState);
  const questionsRef = useRef(questions);
  const currentQuestionIndexRef = useRef(currentQuestionIndex);
  const feedbackRef = useRef(feedback);
  const livesRef = useRef(lives);

  useEffect(() => {
    gameStateRef.current = gameState;
    questionsRef.current = questions;
    currentQuestionIndexRef.current = currentQuestionIndex;
    feedbackRef.current = feedback;
    livesRef.current = lives;
  }, [gameState, questions, currentQuestionIndex, feedback, lives]);

  // Game entities
  const playerRef = useRef({
    pos: { x: 200, y: 904 },
    vel: { x: 0, y: 0 },
    width: 64,
    height: 96,
    grounded: false,
    lastGroundedTime: 0,
    facing: 1 as 1 | -1,
    lastHitTime: 0,
    prevPos: { x: 200, y: 904 }
  });

  const blocksRef = useRef<Block[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);


  const initLevel = useCallback((question: Question) => {
    const blocks: Block[] = [];
    const enemies: Enemy[] = [];

    // Floor
    for (let i = 0; i < CANVAS_WIDTH / TILE_SIZE; i++) {
      blocks.push({
        type: 'FLOOR',
        pos: { x: i * TILE_SIZE, y: CANVAS_HEIGHT - TILE_SIZE },
        vel: { x: 0, y: 0 },
        width: TILE_SIZE,
        height: TILE_SIZE
      });
    }

    // Question Blocks
    const centerX = CANVAS_WIDTH / 2 + 300; // Offset to the right so player doesn't spawn below blocks
    const blockSpacing = 360;
    question.options.forEach((opt, idx) => {
      blocks.push({
        type: 'QUESTION',
        label: opt,
        pos: { x: (centerX - (question.options.length * blockSpacing) / 2) + idx * blockSpacing, y: 720 },
        vel: { x: 0, y: 0 },
        width: TILE_SIZE,
        height: TILE_SIZE,
        isHit: false
      });
    });

    // Spawn 1-2 Goombas per level
    enemies.push({
      type: 'GOOMBA',
      pos: { x: CANVAS_WIDTH - 300, y: CANVAS_HEIGHT - TILE_SIZE - 64 },
      vel: { x: -ENEMY_SPEED, y: 0 },
      width: 64,
      height: 64,
      isDead: false,
      deadTimer: 0,
      facing: -1
    });

    blocksRef.current = blocks;
    enemiesRef.current = enemies;
    playerRef.current.pos = { x: 200, y: 904 };
    playerRef.current.prevPos = { x: 200, y: 904 };
    playerRef.current.vel = { x: 0, y: 0 };
  }, []);

  const spawnCastleLevel = useCallback(() => {
    const blocks: Block[] = [];
    enemiesRef.current = [];
    for (let i = 0; i < CANVAS_WIDTH / TILE_SIZE; i++) {
      blocks.push({
        type: 'FLOOR',
        pos: { x: i * TILE_SIZE, y: CANVAS_HEIGHT - TILE_SIZE },
        vel: { x: 0, y: 0 },
        width: TILE_SIZE,
        height: TILE_SIZE
      });
    }
    blocks.push({
      type: 'CASTLE',
      pos: { x: 1200, y: CANVAS_HEIGHT - TILE_SIZE - 240 },
      vel: { x: 0, y: 0 },
      width: 240,
      height: 240
    });
    blocksRef.current = blocks;
    playerRef.current.pos = { x: 200, y: 904 };
    playerRef.current.prevPos = { x: 200, y: 904 };
    audioService.playSuccess();
  }, []);

  const handleStart = async (topic: string) => {
    setGameState(GameState.LOADING);
    setLives(INITIAL_LIVES);
    const fetched = await fetchQuestions(topic);
    setQuestions(fetched);
    if (fetched.length > 0) {
      setCurrentQuestionIndex(0);
      initLevel(fetched[0]);
      setGameState(GameState.PLAYING);
    }
  };

  const handleStartOffline = () => {
    setGameState(GameState.LOADING);
    setLives(INITIAL_LIVES);

    // Offline development mode questions
    const offlineQuestions: Question[] = [
      {
        id: 1,
        text: "What is the capital of France?",
        options: ["London", "Paris", "Berlin", "Madrid"],
        correctAnswer: "Paris"
      },
      {
        id: 2,
        text: "What is 5 × 7?",
        options: ["30", "35", "40", "45"],
        correctAnswer: "35"
      },
      {
        id: 3,
        text: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        correctAnswer: "Mars"
      }
    ];

    setQuestions(offlineQuestions);
    setCurrentQuestionIndex(0);
    initLevel(offlineQuestions[0]);
    setTimeout(() => setGameState(GameState.PLAYING), 500);
  };

  const handlePause = () => {
    if (gameState === GameState.PLAYING) {
      setGameState(GameState.PAUSED);
    }
  };

  const handleResume = () => {
    if (gameState === GameState.PAUSED) {
      setGameState(GameState.PLAYING);
    }
  };

  // Initialize input handling hook after handlers are defined
  const keysInput = useInput({ gameState, onPause: handlePause, onResume: handleResume });

  const update = useCallback(() => {
    const currentState = gameStateRef.current;
    // Skip updates when paused
    if (currentState !== GameState.PLAYING && currentState !== GameState.SUCCESS) return;

    const player = playerRef.current;
    const now = performance.now();

    // DELTA TIME CALCULATION
    const dt = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;
    // Clamp to max 50ms (prevents huge jumps after tab switch)
    const clampedDt = Math.min(dt, 0.05);
    // Time scale relative to 60FPS (16.6ms)
    const timeScale = clampedDt / (1 / 60);

    // Save previous position for tunneling checks
    player.prevPos = { ...player.pos };

    // Movement
    if (keysInput.current['ArrowLeft'] || keysInput.current['a'] || keysInput.current['A']) {
      player.vel.x = -MOVE_SPEED;
      player.facing = -1;
    } else if (keysInput.current['ArrowRight'] || keysInput.current['d'] || keysInput.current['D']) {
      player.vel.x = MOVE_SPEED;
      player.facing = 1;
    } else {
      player.vel.x *= 0.8;
    }

    // Jump Logic
    const canJump = player.grounded || (now - player.lastGroundedTime < COYOTE_TIME);
    const jumpPressed = keysInput.current['ArrowUp'] || keysInput.current['w'] || keysInput.current['W'] || keysInput.current[' '];

    if (jumpPressed && canJump) {
      player.vel.y = JUMP_STRENGTH;
      player.grounded = false;
      player.lastGroundedTime = 0;
      audioService.playJump();
    }

    if (!jumpPressed && player.vel.y < 0) {
      player.vel.y *= 0.5;
    }

    player.vel.y += GRAVITY;
    player.pos.x += player.vel.x;
    player.pos.y += player.vel.y;

    if (player.pos.x < 0) player.pos.x = 0;
    if (player.pos.x + player.width > CANVAS_WIDTH) player.pos.x = CANVAS_WIDTH - player.width;

    player.grounded = false;

    // Block collisions
    blocksRef.current.forEach((block) => {
      if (
        player.pos.x < block.pos.x + block.width &&
        player.pos.x + player.width > block.pos.x &&
        player.pos.y < block.pos.y + block.height &&
        player.pos.y + player.height > block.pos.y
      ) {
        const overlapX = Math.min(player.pos.x + player.width - block.pos.x, block.pos.x + block.width - player.pos.x);
        const overlapY = Math.min(player.pos.y + player.height - block.pos.y, block.pos.y + block.height - player.pos.y);

        if (overlapX > overlapY) {
          if (player.vel.y > 0) {
            player.pos.y = block.pos.y - player.height;
            player.vel.y = 0;
            player.grounded = true;
          } else if (player.vel.y < 0) {
            player.pos.y = block.pos.y + block.height;
            player.vel.y = 0;
            audioService.playHit();

            if (block.type === 'QUESTION' && !block.isHit && gameStateRef.current === GameState.PLAYING && !feedbackRef.current) {
              block.isHit = true;
              const currentQ = questionsRef.current[currentQuestionIndexRef.current];
              if (block.label === currentQ.correctAnswer) {
                setFeedback('CORRECT!');
                audioService.playCorrect();
                setTimeout(() => {
                  setFeedback(null);
                  if (currentQuestionIndexRef.current + 1 < questionsRef.current.length) {
                    const nextIndex = currentQuestionIndexRef.current + 1;
                    setCurrentQuestionIndex(nextIndex);
                    initLevel(questionsRef.current[nextIndex]);
                  } else {
                    setGameState(GameState.SUCCESS);
                    spawnCastleLevel();
                  }
                }, 1000);
              } else {
                setFeedback('TRY AGAIN!');
                audioService.playIncorrect();
                setTimeout(() => {
                  setFeedback(null);
                  block.isHit = false;
                }, 800);
              }
            }
          }
        } else {
          if (player.vel.x > 0) {
            player.pos.x = block.pos.x - player.width;
          } else {
            player.pos.x = block.pos.x + block.width;
          }
        }
      } else {
        // Anti-tunneling: Check if we passed through a floor
        // Condition: previous Bottom was <= block Top, AND current Bottom >= block Top
        // AND x overlap exists
        if (
          player.prevPos.y + player.height <= block.pos.y &&
          player.pos.y + player.height >= block.pos.y &&
          player.pos.x < block.pos.x + block.width &&
          player.pos.x + player.width > block.pos.x
        ) {
          player.pos.y = block.pos.y - player.height;
          player.vel.y = 0;
          player.grounded = true;
        }
      }
    });

    // Enemy logic
    enemiesRef.current.forEach(enemy => {
      if (enemy.isDead) {
        enemy.deadTimer += timeScale; // Scale animation timer
        return;
      }

      // Patrol
      enemy.pos.x += enemy.vel.x * timeScale;
      if (enemy.pos.x < 0 || enemy.pos.x + enemy.width > CANVAS_WIDTH) {
        enemy.vel.x *= -1;
        enemy.facing = enemy.vel.x > 0 ? 1 : -1;
      }

      // Player vs Enemy
      if (
        player.pos.x < enemy.pos.x + enemy.width &&
        player.pos.x + player.width > enemy.pos.x &&
        player.pos.y < enemy.pos.y + enemy.height &&
        player.pos.y + player.height > enemy.pos.y
      ) {
        // Check if player is falling on top
        if (player.vel.y > 0 && player.pos.y + player.height < enemy.pos.y + enemy.height / 2) {
          enemy.isDead = true;
          player.vel.y = JUMP_STRENGTH * 0.6; // Bounce
          audioService.playStomp();
        } else {
          // Hit from side - Enemy also dies when it hits player
          if (now - player.lastHitTime > INVULNERABILITY_TIME) {
            enemy.isDead = true;
            player.lastHitTime = now;

            // Apply penalty/reset immediately
            player.pos = { x: 200, y: 904 };
            player.prevPos = { x: 200, y: 904 };
            player.vel = { x: 0, y: 0 };
            audioService.playIncorrect();

            // Handle life loss
            setLives(prev => {
              const nextLives = prev - 1;
              if (nextLives <= 0) {
                setGameState(GameState.GAMEOVER);
              }
              return nextLives;
            });
          }
        }
      }
    });

    // Cleanup dead enemies - only remove if dead AND animation finished
    enemiesRef.current = enemiesRef.current.filter(e => !(e.isDead && e.deadTimer >= 30));

    if (player.grounded) {
      player.lastGroundedTime = now;
    }

    if (player.pos.y > CANVAS_HEIGHT + 64 && now - player.lastHitTime > INVULNERABILITY_TIME) {
      // Pit logic
      player.lastHitTime = now;
      player.pos = { x: 200, y: 904 };
      player.vel = { x: 0, y: 0 };
      audioService.playIncorrect();

      setLives(prev => {
        const nextLives = prev - 1;
        if (nextLives <= 0) {
          setGameState(GameState.GAMEOVER);
        }
        return nextLives;
      });
    }
  }, [initLevel, spawnCastleLevel]); // Dependencies reduced significantly


  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = COLORS.SKY;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawEnvironment(ctx, CANVAS_HEIGHT, TILE_SIZE);

    blocksRef.current.forEach(block => {
      if (block.type === 'FLOOR') {
        ctx.fillStyle = COLORS.DIRT;
        ctx.fillRect(block.pos.x, block.pos.y, block.width, block.height);
        ctx.fillStyle = COLORS.GRASS;
        ctx.fillRect(block.pos.x, block.pos.y, block.width, 8);
      } else if (block.type === 'QUESTION') {
        ctx.fillStyle = block.isHit ? COLORS.HIT_BLOCK : COLORS.QUESTION_BLOCK;
        ctx.fillRect(block.pos.x, block.pos.y, block.width, block.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(block.pos.x, block.pos.y, block.width, block.height);

        if (!block.isHit) {
          ctx.strokeStyle = 'rgba(255,255,255,0.5)';
          ctx.strokeRect(block.pos.x + 4, block.pos.y + 4, block.width - 8, block.height - 8);
          ctx.fillStyle = '#000';
          ctx.font = 'bold 48px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('?', block.pos.x + block.width / 2, block.pos.y + 38);
        }

        ctx.fillStyle = '#fff';
        ctx.font = '18px "Press Start 2P"';
        ctx.textAlign = 'center';
        const words = block.label?.split(' ') || [];
        const lines: string[] = [];
        let currentLine = "";
        words.forEach(word => {
          if ((currentLine + word).length < 15) currentLine += (currentLine ? " " : "") + word;
          else { lines.push(currentLine); currentLine = word; }
        });
        lines.push(currentLine);
        lines.reverse().forEach((line, i) => {
          ctx.fillText(line, block.pos.x + block.width / 2, block.pos.y - 40 - (i * 24));
        });
      } else if (block.type === 'CASTLE') {
        ctx.fillStyle = COLORS.CASTLE;
        ctx.fillRect(block.pos.x, block.pos.y, block.width, block.height);
        ctx.fillStyle = '#000';
        ctx.fillRect(block.pos.x + block.width / 2 - 15, block.pos.y + block.height - 40, 30, 40);
        for (let i = 0; i < 4; i++) ctx.fillRect(block.pos.x + i * 35, block.pos.y - 20, 15, 20);
      }
    });

    enemiesRef.current.forEach(enemy => drawEnemy(ctx, enemy));

    if (gameStateRef.current !== GameState.GAMEOVER) {
      drawPlayer(ctx, playerRef.current);
    }
  }, []); // Constant draw function

  // Game loop
  useEffect(() => {
    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      update();
      draw(ctx);
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update, draw]);

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-neutral-900 overflow-hidden relative">
      <div className="relative border-8 border-black shadow-2xl overflow-hidden rounded-xl bg-sky-400 max-w-[95vw] max-h-[95vh]">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full"
          style={{ imageRendering: 'pixelated' }}
        />
        <GameUI
          gameState={gameState}
          currentQuestion={questions[currentQuestionIndex]}
          currentQuestionIndex={currentQuestionIndex}
          onStart={handleStart}
          onStartOffline={handleStartOffline}
          onPause={handlePause}
          onResume={handleResume}
          feedback={feedback}
          score={currentQuestionIndex * 100}
          totalQuestions={questions.length}
          lives={lives}
        />
      </div>
    </div>
  );
};

export default App;
