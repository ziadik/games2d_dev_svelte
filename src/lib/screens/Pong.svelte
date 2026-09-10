<script lang="ts">
  import { onMount } from 'svelte';
  import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT, WINNING_SCORE } from '../pong/constants';
  import type { GameState, Ball, Paddle, SoundName } from '../pong/types';
  import {
    createPlayer1,
    createPlayer2,
    createBall,
    resetBall,
  } from '../pong/entities';
  import {
    collides,
    bounceWalls,
    bouncePaddle,
    movePaddle,
    stepBall,
    applyInput,
  } from '../pong/physics';
  import { playSound, unlockAudio } from '../pong/audio';

  let { onExit }: { onExit: () => void } = $props();

  // --- Canvas binding ---
  let canvas = $state<HTMLCanvasElement | null>(null);
  let ctx: CanvasRenderingContext2D | null = null;
  let rafId = 0;

  // --- Масштабирование виртуального разрешения ---
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  // --- Состояние, которое управляет рендером UI внутри canvas ---
  let gameState = $state<GameState>('start');
  let player1Score = $state(0);
  let player2Score = $state(0);
  let servingPlayer = $state(1);
  let winningPlayer = $state(0);

  // --- Игровые сущности — НЕ $state (меняются 60 раз/сек) ---
  const player1: Paddle = createPlayer1();
  const player2: Paddle = createPlayer2();
  const ball: Ball = createBall();

  // --- Ввод ---
  const keys = new Set<string>();

  // --- FPS ---
  let fps = 0;
  let fpsAccum = 0;
  let fpsFrames = 0;
  let lastTime = 0;

  function setupCanvas(): void {
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    scale = Math.min(w / VIRTUAL_WIDTH, h / VIRTUAL_HEIGHT);
    offsetX = Math.floor((w - VIRTUAL_WIDTH * scale) / 2);
    offsetY = Math.floor((h - VIRTUAL_HEIGHT * scale) / 2);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  function update(dt: number): void {
    if (gameState === 'serve') {
      ball.dy = Math.random() * 100 - 50;
      ball.dx = servingPlayer === 1
        ? Math.random() * 60 + 140
        : -(Math.random() * 60 + 140);
    } else if (gameState === 'play') {
      if (collides(ball, player1)) {
        bouncePaddle(ball, player1, 'left');
        playSound('paddle_hit');
      }
      if (collides(ball, player2)) {
        bouncePaddle(ball, player2, 'right');
        playSound('paddle_hit');
      }

      if (bounceWalls(ball)) playSound('wall_hit');

      if (ball.x < 0) {
        servingPlayer = 1;
        player2Score += 1;
        playSound('score');
        if (player2Score === WINNING_SCORE) {
          winningPlayer = 2;
          gameState = 'done';
        } else {
          gameState = 'serve';
          resetBall(ball);
        }
      }
      if (ball.x > VIRTUAL_WIDTH) {
        servingPlayer = 2;
        player1Score += 1;
        playSound('score');
        if (player1Score === WINNING_SCORE) {
          winningPlayer = 1;
          gameState = 'done';
        } else {
          gameState = 'serve';
          resetBall(ball);
        }
      }

      stepBall(ball, dt);
    }

    applyInput(player1, keys.has('w'), keys.has('s'));
    applyInput(player2, keys.has('arrowup'), keys.has('arrowdown'));
    movePaddle(player1, dt);
    movePaddle(player2, dt);
  }

  function render(): void {
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Фон поля
    ctx.fillStyle = 'rgb(40, 45, 52)';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Центральная пунктирная линия
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = 0; y < VIRTUAL_HEIGHT; y += 8) {
      ctx.moveTo(VIRTUAL_WIDTH / 2, y);
      ctx.lineTo(VIRTUAL_WIDTH / 2, y + 4);
    }
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'top';

    // UI-сообщения
    if (gameState === 'start') {
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Welcome to Pong!', VIRTUAL_WIDTH / 2, 10);
      ctx.fillText('Press Enter to begin!', VIRTUAL_WIDTH / 2, 20);
    } else if (gameState === 'serve') {
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Player ${servingPlayer}'s serve!`, VIRTUAL_WIDTH / 2, 10);
      ctx.fillText('Press Enter to serve!', VIRTUAL_WIDTH / 2, 20);
    } else if (gameState === 'done') {
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Player ${winningPlayer} wins!`, VIRTUAL_WIDTH / 2, 10);
      ctx.font = '8px monospace';
      ctx.fillText('Press Enter to restart!', VIRTUAL_WIDTH / 2, 30);
    }

    // Счёт
    ctx.font = '32px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(String(player1Score), VIRTUAL_WIDTH / 2 - 50, VIRTUAL_HEIGHT / 3);
    ctx.fillText(String(player2Score), VIRTUAL_WIDTH / 2 + 30, VIRTUAL_HEIGHT / 3);

    // Объекты
    ctx.fillRect(player1.x, player1.y, player1.width, player1.height);
    ctx.fillRect(player2.x, player2.y, player2.width, player2.height);
    ctx.fillRect(ball.x, ball.y, ball.width, ball.height);

    // FPS
    ctx.font = '8px monospace';
    ctx.fillStyle = 'rgb(0,255,0)';
    ctx.fillText('FPS: ' + fps, 10, 10);

    ctx.restore();
  }

  function loop(time: number): void {
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    fpsAccum += dt;
    fpsFrames += 1;
    if (fpsAccum >= 0.5) {
      fps = Math.round(fpsFrames / fpsAccum);
      fpsAccum = 0;
      fpsFrames = 0;
    }

    update(dt);
    render();
    rafId = requestAnimationFrame(loop);
  }

  function handleKeyDown(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();

    if (key === 'escape') {
      onExit();
      return;
    }

    if (key === 'arrowup' || key === 'arrowdown' || key === ' ') {
      e.preventDefault();
    }
    keys.add(key);

    if (key === 'enter') {
      if (gameState === 'start') gameState = 'serve';
      else if (gameState === 'serve') gameState = 'play';
      else if (gameState === 'done') {
        gameState = 'serve';
        resetBall(ball);
        player1Score = 0;
        player2Score = 0;
        servingPlayer = winningPlayer === 1 ? 2 : 1;
      }
    }
  }

  function handleKeyUp(e: KeyboardEvent): void {
    keys.delete(e.key.toLowerCase());
  }

  onMount(() => {
    if (!canvas) return;
    const c2d = canvas.getContext('2d');
    if (!c2d) return;
    ctx = c2d;

    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    lastTime = performance.now();
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', setupCanvas);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  });
</script>

<div class="game">
  <button class="back" onclick={onExit}>← Меню</button>
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .game {
    position: relative;
    height: 100vh;
  }
  canvas {
    display: block;
    width: 100vw;
    height: 100vh;
    cursor: none;
  }
  .back {
    position: fixed;
    top: 1rem;
    left: 1rem;
    z-index: 10;
    padding: 0.5rem 1rem;
    font-family: monospace;
    font-size: 0.875rem;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    border: 1px solid #fff;
    cursor: pointer;
  }
  .back:hover {
    background: #fff;
    color: #000;
  }
</style>