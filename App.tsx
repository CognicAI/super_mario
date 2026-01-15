
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Question, Block, Enemy, Vector2D } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, COLORS, GRAVITY, JUMP_STRENGTH, MOVE_SPEED } from './constants';
import { getRandomQuestions } from './services/databaseService';
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
const RESPAWN_DELAY = 1000; // ms - time player cannot control character after respawn


const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [showHint, setShowHint] = useState(false);
  const [showFunFact, setShowFunFact] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | undefined>(undefined);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(undefined);
  const lastTimeRef = useRef<number>(0);

  // State refs for game loop
  const gameStateRef = useRef(gameState);
  const questionsRef = useRef(questions);
  const currentQuestionIndexRef = useRef(currentQuestionIndex);
  const feedbackRef = useRef(feedback);
  const livesRef = useRef(lives);
  const showHintRef = useRef(showHint);
  const showFunFactRef = useRef(showFunFact);

  useEffect(() => {
    gameStateRef.current = gameState;
    questionsRef.current = questions;
    currentQuestionIndexRef.current = currentQuestionIndex;
    feedbackRef.current = feedback;
    livesRef.current = lives;
    showHintRef.current = showHint;
    showFunFactRef.current = showFunFact;
  }, [gameState, questions, currentQuestionIndex, feedback, lives, showHint, showFunFact]);

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
    prevPos: { x: 200, y: 904 },
    respawnTime: 0,
    isHit: false,
    hitAnimationTimer: 0
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

    // Add pipe barrier between player and enemy zone
    blocks.push({
      type: 'PIPE',
      pos: { x: 350, y: CANVAS_HEIGHT - TILE_SIZE - 128 },
      vel: { x: 0, y: 0 },
      width: 96,
      height: 128
    });

    // Enemy - starts on the right, patrols within safe zone
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

  const handleStart = async (topic: string, selectedDifficulty?: 'easy' | 'medium' | 'hard') => {
    setGameState(GameState.LOADING);
    setLives(INITIAL_LIVES);
    setDifficulty(selectedDifficulty);

    try {
      // Fetch ALL questions from database with optional difficulty filter
      const fetched = await getRandomQuestions(100, topic, selectedDifficulty); // Fetch up to 100 questions

      if (fetched.length === 0) {
        const difficultyMsg = selectedDifficulty ? ` (${selectedDifficulty} difficulty)` : '';
        alert(`No questions found for topic: "${topic}"${difficultyMsg}. Please try a different topic or add questions to the database first.`);
        setGameState(GameState.MENU);
        return;
      }

      setQuestions(fetched);
      setCurrentQuestionIndex(0);
      setShowHint(false);
      setShowFunFact(false);
      initLevel(fetched[0]);
      setGameState(GameState.PLAYING);
    } catch (error) {
      console.error('Error loading questions from database:', error);
      alert('Failed to load questions from database. Please check your connection.');
      setGameState(GameState.MENU);
    }
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

  const handleDismissFunFact = () => {
    setFeedback(null);
    setShowFunFact(false);
    setShowHint(false);

    if (currentQuestionIndex + 1 < questions.length) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      initLevel(questions[nextIndex]);
    } else {
      setGameState(GameState.SUCCESS);
      spawnCastleLevel();
    }
  };

  const handleToggleHint = () => {
    // Just toggle hint - the update loop will skip when hint is showing
    setShowHint(!showHint);
  };

  // Initialize input handling hook after handlers are defined
  const keysInput = useInput({ gameState, onPause: handlePause, onResume: handleResume });

  const update = useCallback(() => {
    const currentState = gameStateRef.current;
    // Skip updates when paused, or when hint/fun fact is showing
    if (currentState !== GameState.PLAYING && currentState !== GameState.SUCCESS) return;
    if (showHintRef.current || showFunFactRef.current) return; // Pause game when hint or fun fact is visible

    const player = playerRef.current;
    const now = performance.now();

    // DELTA TIME CALCULATION
    const dt = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;
    // Clamp to max 50ms (prevents huge jumps after tab switch)
    const clampedDt = Math.min(dt, 0.05);
    // Time scale relative to 60FPS (16.6ms)
    const timeScale = clampedDt / (1 / 60);

    // Save previous position for anti-tunneling checks
    player.prevPos = { ...player.pos };

    // === INPUT HANDLING ===
    // Block input during respawn delay
    const isRespawning = now - player.respawnTime < RESPAWN_DELAY;

    if (!isRespawning) {
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
    } else {
      // During respawn delay, gradually slow down any existing velocity
      player.vel.x *= 0.8;
    }

    // Apply gravity
    player.vel.y += GRAVITY;

    // === PER-AXIS COLLISION RESOLUTION ===

    // 1. MOVE AND RESOLVE X-AXIS
    player.pos.x += player.vel.x;

    // Clamp to canvas boundaries
    if (player.pos.x < 0) {
      player.pos.x = 0;
      player.vel.x = 0;
    }
    if (player.pos.x + player.width > CANVAS_WIDTH) {
      player.pos.x = CANVAS_WIDTH - player.width;
      player.vel.x = 0;
    }

    // Check X collisions with blocks
    blocksRef.current.forEach((block) => {
      if (
        player.pos.x < block.pos.x + block.width &&
        player.pos.x + player.width > block.pos.x &&
        player.pos.y < block.pos.y + block.height &&
        player.pos.y + player.height > block.pos.y
      ) {
        // X-axis collision detected
        if (player.vel.x > 0) {
          // Moving right, hit left side of block
          player.pos.x = block.pos.x - player.width;
          player.vel.x = 0;
        } else if (player.vel.x < 0) {
          // Moving left, hit right side of block
          player.pos.x = block.pos.x + block.width;
          player.vel.x = 0;
        }
      }
    });

    // 2. MOVE AND RESOLVE Y-AXIS
    player.pos.y += player.vel.y;
    player.grounded = false;

    // Check Y collisions with blocks
    blocksRef.current.forEach((block) => {
      if (
        player.pos.x < block.pos.x + block.width &&
        player.pos.x + player.width > block.pos.x &&
        player.pos.y < block.pos.y + block.height &&
        player.pos.y + player.height > block.pos.y
      ) {
        // Y-axis collision detected
        if (player.vel.y > 0) {
          // Falling down, hit top of block (FLOOR COLLISION)
          player.pos.y = block.pos.y - player.height; // Snap UP to floor top
          player.vel.y = 0;
          player.grounded = true;
        } else if (player.vel.y < 0) {
          // Moving up, hit bottom of block (CEILING COLLISION)
          player.pos.y = block.pos.y + block.height; // Snap DOWN to ceiling bottom
          player.vel.y = 0;
          audioService.playHit();

          // Question block logic
          if (block.type === 'QUESTION' && !block.isHit && gameStateRef.current === GameState.PLAYING && !feedbackRef.current) {
            block.isHit = true;
            const currentQ = questionsRef.current[currentQuestionIndexRef.current];
            if (block.label === currentQ.correctAnswer) {
              setFeedback('CORRECT!');
              setShowFunFact(true);
              audioService.playCorrect();
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
      }
    });

    // 3. ANTI-TUNNELING CHECK (for extremely fast falls)
    // Only check if we didn't already collide above
    if (!player.grounded) {
      blocksRef.current.forEach((block) => {
        // Check if we passed through a floor this frame
        if (
          player.prevPos.y + player.height <= block.pos.y &&
          player.pos.y + player.height >= block.pos.y &&
          player.pos.x < block.pos.x + block.width &&
          player.pos.x + player.width > block.pos.x
        ) {
          // Tunneled through floor - snap up
          player.pos.y = block.pos.y - player.height;
          player.vel.y = 0;
          player.grounded = true;
        }
      });
    }

    // Enemy logic
    enemiesRef.current.forEach(enemy => {
      if (enemy.isDead) {
        enemy.deadTimer += timeScale; // Scale animation timer
        return;
      }

      // Patrol within safe boundaries (don't overlap with pipe or go to player spawn)
      const PIPE_X = 350; // Assuming pipe starts at x=350
      const PIPE_WIDTH = 96; // Assuming pipe width is 96
      const PIPE_END = PIPE_X + PIPE_WIDTH; // Pipe x position + pipe width = 446
      const MIN_ENEMY_X = PIPE_END + 20; // Add 20px buffer = 466
      const MAX_ENEMY_X = CANVAS_WIDTH;

      enemy.pos.x += enemy.vel.x * timeScale;

      // Bounce at boundaries
      if (enemy.pos.x < MIN_ENEMY_X || enemy.pos.x + enemy.width > MAX_ENEMY_X) {
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
          // Hit from side - Player loses life, enemy survives (classic Mario behavior)
          if (now - player.lastHitTime > INVULNERABILITY_TIME) {
            player.lastHitTime = now;

            // Trigger hit animation
            player.isHit = true;
            player.hitAnimationTimer = 0;

            // Apply penalty/reset immediately
            player.pos = { x: 200, y: 904 };
            player.prevPos = { x: 200, y: 904 };
            player.vel = { x: 0, y: 0 };
            player.respawnTime = now;
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

      // Trigger hit animation
      player.isHit = true;
      player.hitAnimationTimer = 0;

      player.pos = { x: 200, y: 904 };
      player.vel = { x: 0, y: 0 };
      player.respawnTime = now;
      audioService.playIncorrect();

      setLives(prev => {
        const nextLives = prev - 1;
        if (nextLives <= 0) {
          setGameState(GameState.GAMEOVER);
        }
        return nextLives;
      });
    }

    // Update hit animation timer
    if (player.isHit) {
      player.hitAnimationTimer += timeScale;
      // End hit animation after invulnerability period
      if (now - player.lastHitTime >= INVULNERABILITY_TIME) {
        player.isHit = false;
        player.hitAnimationTimer = 0;
      }
    }
  }, [initLevel, spawnCastleLevel]); // Dependencies reduced significantly


  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = COLORS.SKY;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawEnvironment(ctx, CANVAS_HEIGHT, TILE_SIZE);

    blocksRef.current.forEach(block => {
      switch (block.type) {
        case 'FLOOR':
          ctx.fillStyle = COLORS.DIRT;
          ctx.fillRect(block.pos.x, block.pos.y, block.width, block.height);
          ctx.fillStyle = COLORS.GRASS;
          ctx.fillRect(block.pos.x, block.pos.y, block.width, 8);
          break;

        case 'PIPE':
          // Green pipe body
          ctx.fillStyle = '#2ECC40';
          ctx.fillRect(block.pos.x, block.pos.y, block.width, block.height);
          // Pipe rim (top)
          ctx.fillStyle = '#01FF70';
          ctx.fillRect(block.pos.x - 8, block.pos.y, block.width + 16, 16);
          // Pipe outline
          ctx.strokeStyle = '#1a8c26';
          ctx.lineWidth = 3;
          ctx.strokeRect(block.pos.x, block.pos.y, block.width, block.height);
          // Vertical line in middle
          ctx.beginPath();
          ctx.moveTo(block.pos.x + block.width / 2, block.pos.y + 16);
          ctx.lineTo(block.pos.x + block.width / 2, block.pos.y + block.height);
          ctx.stroke();
          break;

        case 'QUESTION':
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
            ctx.fillText(line, block.pos.x + block.width / 2, block.pos.y - 10 - i * 20);
          });
          break;

        case 'CASTLE':
          ctx.fillStyle = COLORS.CASTLE;
          ctx.fillRect(block.pos.x, block.pos.y, block.width, block.height);
          ctx.fillStyle = '#000';
          ctx.fillRect(block.pos.x + block.width / 2 - 15, block.pos.y + block.height - 40, 30, 40);
          for (let i = 0; i < 4; i++) ctx.fillRect(block.pos.x + i * 35, block.pos.y - 20, 15, 20);
          break;
      }
    });

    enemiesRef.current.forEach(enemy => drawEnemy(ctx, enemy));

    if (gameStateRef.current !== GameState.GAMEOVER) {
      drawPlayer(ctx, playerRef.current, performance.now() - playerRef.current.lastHitTime);
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
          onPause={handlePause}
          onResume={handleResume}
          feedback={feedback}
          score={currentQuestionIndex * 100}
          totalQuestions={questions.length}
          lives={lives}
          showHint={showHint}
          onToggleHint={handleToggleHint}
          showFunFact={showFunFact}
          onDismissFunFact={handleDismissFunFact}
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
        />
      </div>
    </div>
  );
};

export default App;
