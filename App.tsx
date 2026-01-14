
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Question, Block, Enemy, Vector2D } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, COLORS, GRAVITY, JUMP_STRENGTH, MOVE_SPEED } from './constants';
import { fetchQuestions } from './services/geminiService';
import { audioService } from './services/audioService';
import GameUI from './components/GameUI';

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

  // Game entities
  const playerRef = useRef({
    pos: { x: 200, y: 904 },
    vel: { x: 0, y: 0 },
    width: 64,
    height: 96,
    grounded: false,
    lastGroundedTime: 0,
    facing: 1 as 1 | -1,
    lastHitTime: 0
  });

  const blocksRef = useRef<Block[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const keys = useRef<{ [key: string]: boolean }>({});

  const MARIO_PIXELS = [
    "____RRRRR___",
    "___RRRRRRRRR",
    "___MMMSSSMS_",
    "__MSMS SSSMS",
    "__MSMM SSSMS",
    "__MMSSSSMMMM",
    "____SSSSSSS_",
    "___RRBRRR___",
    "__RRRBRRBRR_",
    "_RRRRBBBBRRR",
    "SSRBWBBWBRSS",
    "SS SBBBBBBSS",
    "S SBBBBBBBB S",
    "___BBB__BBB_",
    "__MMM____MMM",
    "_MMMM____MMMM"
  ];

  const GOOMBA_PIXELS = [
    "____BBBB____",
    "___BBBBBB___",
    "__BBBBBBBB__",
    "_BBWWBBWWBB_",
    "_BBWWBWWBWBB_",
    "_BBBBBBBBBB_",
    "__BBBBBBBB__",
    "___MM__MM___"
  ];

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
    const centerX = CANVAS_WIDTH / 2;
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

  const update = useCallback(() => {
    if (gameState !== GameState.PLAYING && gameState !== GameState.SUCCESS) return;

    const player = playerRef.current;
    const now = performance.now();

    // Movement
    if (keys.current['ArrowLeft'] || keys.current['a'] || keys.current['A']) {
      player.vel.x = -MOVE_SPEED;
      player.facing = -1;
    } else if (keys.current['ArrowRight'] || keys.current['d'] || keys.current['D']) {
      player.vel.x = MOVE_SPEED;
      player.facing = 1;
    } else {
      player.vel.x *= 0.8;
    }

    // Jump Logic
    const canJump = player.grounded || (now - player.lastGroundedTime < COYOTE_TIME);
    const jumpPressed = keys.current['ArrowUp'] || keys.current['w'] || keys.current['W'] || keys.current[' '];

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

            if (block.type === 'QUESTION' && !block.isHit && gameState === GameState.PLAYING && !feedback) {
              block.isHit = true;
              const currentQ = questions[currentQuestionIndex];
              if (block.label === currentQ.correctAnswer) {
                setFeedback('CORRECT!');
                audioService.playCorrect();
                setTimeout(() => {
                  setFeedback(null);
                  if (currentQuestionIndex + 1 < questions.length) {
                    const nextIndex = currentQuestionIndex + 1;
                    setCurrentQuestionIndex(nextIndex);
                    initLevel(questions[nextIndex]);
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
      }
    });

    // Enemy logic
    enemiesRef.current.forEach(enemy => {
      if (enemy.isDead) {
        enemy.deadTimer++;
        return;
      }

      // Patrol
      enemy.pos.x += enemy.vel.x;
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

    if (player.pos.y > CANVAS_HEIGHT && now - player.lastHitTime > INVULNERABILITY_TIME) {
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
  }, [gameState, questions, currentQuestionIndex, initLevel, spawnCastleLevel, feedback]);

  const drawPlayer = (ctx: CanvasRenderingContext2D) => {
    const p = playerRef.current;
    const pixelSize = 6;
    const startX = p.pos.x + (p.width - (12 * pixelSize)) / 2;
    const startY = p.pos.y;

    ctx.save();
    MARIO_PIXELS.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const char = row[x];
        if (char === '_') continue;
        let color = '#000';
        switch (char) {
          case 'R': color = '#FF0000'; break;
          case 'B': color = '#0000FF'; break;
          case 'S': color = '#FFCC99'; break;
          case 'M': color = '#4B2E0B'; break;
          case 'W': color = '#FFFFFF'; break;
        }
        ctx.fillStyle = color;
        const drawX = p.facing === 1 ? startX + x * pixelSize : startX + (11 - x) * pixelSize;
        ctx.fillRect(drawX, startY + y * pixelSize, pixelSize, pixelSize);
      }
    });
    ctx.restore();
  };

  const drawEnemy = (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
    const pixelSize = enemy.isDead ? 3 : 6;
    const startX = enemy.pos.x;
    const startY = enemy.isDead ? enemy.pos.y + 32 : enemy.pos.y;

    GOOMBA_PIXELS.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const char = row[x];
        if (char === '_') continue;
        let color = '#000';
        switch (char) {
          case 'B': color = '#8B4513'; break;
          case 'W': color = '#FFFFFF'; break;
          case 'M': color = '#000000'; break;
        }
        ctx.fillStyle = color;
        ctx.fillRect(startX + x * pixelSize, startY + y * pixelSize, pixelSize, pixelSize);
      }
    });
  };

  const drawEnvironment = (ctx: CanvasRenderingContext2D) => {
    // Static background elements
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    [{ x: 160, y: 100 }, { x: 700, y: 200 }, { x: 1200, y: 80 }, { x: 1600, y: 160 }].forEach(cloud => {
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, 30, 0, Math.PI * 2);
      ctx.arc(cloud.x + 30, cloud.y - 16, 50, 0, Math.PI * 2);
      ctx.arc(cloud.x + 60, cloud.y, 30, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    [{ x: 300, y: 160 }, { x: 900, y: 240 }, { x: 1500, y: 120 }].forEach(cloud => {
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, 50, 0, Math.PI * 2);
      ctx.arc(cloud.x + 50, cloud.y - 20, 70, 0, Math.PI * 2);
      ctx.arc(cloud.x + 100, cloud.y, 50, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#3E8E58';
    [{ x: 200, w: 600, h: 240 }, { x: 1000, w: 800, h: 360 }, { x: 1700, w: 500, h: 180 }].forEach(hill => {
      ctx.beginPath();
      ctx.ellipse(hill.x, CANVAS_HEIGHT - TILE_SIZE, hill.w / 2, hill.h, 0, Math.PI, 0);
      ctx.fill();
    });

    ctx.fillStyle = '#4FB06D';
    [{ x: 500, w: 400, h: 160 }, { x: 1300, w: 500, h: 220 }].forEach(hill => {
      ctx.beginPath();
      ctx.ellipse(hill.x, CANVAS_HEIGHT - TILE_SIZE, hill.w / 2, hill.h, 0, Math.PI, 0);
      ctx.fill();
    });

    ctx.fillStyle = '#228B22';
    [{ x: 100, w: 120 }, { x: 600, w: 160 }, { x: 1100, w: 100 }, { x: 1560, w: 140 }].forEach(bush => {
      ctx.beginPath();
      ctx.arc(bush.x, CANVAS_HEIGHT - TILE_SIZE, bush.w / 2, Math.PI, 0);
      ctx.fill();
    });
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = COLORS.SKY;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawEnvironment(ctx);

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

    if (gameState !== GameState.GAMEOVER) {
      drawPlayer(ctx);
    }
  }, [currentQuestionIndex, gameState]);

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    update();
    draw(ctx);
    requestRef.current = requestAnimationFrame(loop);
  }, [update, draw]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [loop]);

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
