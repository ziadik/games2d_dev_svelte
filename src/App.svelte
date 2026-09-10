<script lang="ts">
  import Menu from './lib/screens/Menu.svelte';
  import Game from './lib/screens/Pong.svelte';

  type Screen = 'menu' | 'game';
  let screen = $state<Screen>('menu');
</script>

{#if screen === 'menu'}
  <Menu onStart={() => screen = 'game'} />
{:else}
  <Game onExit={() => screen = 'menu'} />
{/if}

<style>
  :global(html, body) {
    margin: 0; padding: 0; height: 100%;
    background: #0a0a0a; font-family: monospace; color: #fff;
  }
</style>
<!-- <script lang="ts">
  import { onMount } from 'svelte';

  const VIRTUAL_WIDTH = 432;
  const VIRTUAL_HEIGHT = 243;
  const PADDLE_SPEED = 200;

  type Paddle = { x: number; y: number; width: number; height: number; dy: number };
  type Ball   = { x: number; y: number; width: number; height: number; dx: number; dy: number };
  type Rect   = { x: number; y: number; width: number; height: number };
  type GameState = 'start' | 'serve' | 'play' | 'done';

  // Canvas binding — allow null so TS + runtime force a guard
  let canvas = $state<HTMLCanvasElement | null>(null);
  let ctx: CanvasRenderingContext2D | null = null;

  let scale = 1, offsetX = 0, offsetY = 0;
  let rafId = 0;

  // Game state
  let player1Score = $state(0);
  let player2Score = $state(0);
  let servingPlayer = $state(1);
  let winningPlayer = $state(0);
  let gameState = $state<GameState>('start');

  // Entities
  const player1: Paddle = { x: 10, y: 30, width: 5, height: 20, dy: 0 };
  const player2: Paddle = { x: VIRTUAL_WIDTH - 10, y: VIRTUAL_HEIGHT - 30, width: 5, height: 20, dy: 0 };
  const ball: Ball    = { x: VIRTUAL_WIDTH / 2 - 2, y: VIRTUAL_HEIGHT / 2 - 2, width: 4, height: 4, dx: 0, dy: 0 };

  const keys = new Set<string>();

  // --- Audio ---
  let audioCtx: AudioContext | null = null;
  function beep(freq: number, duration: number, type: OscillatorType = 'square', gain = 0.06) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const sounds = {
    paddle_hit: () => beep(440, 0.05),
    wall_hit:   () => beep(220, 0.05),
    score:      () => beep(120, 0.2, 'sawtooth', 0.08),
  };

  // --- Collision ---
  function collides(a: Rect, b: Rect): boolean {
    if (a.x >= b.x + b.width || b.x >= a.x + a.width) return false;
    if (a.y >= b.y + b.height || b.y >= a.y + a.height) return false;
    return true;
  }
  function resetBall() {
    ball.x = VIRTUAL_WIDTH / 2 - 2;
    ball.y = VIRTUAL_HEIGHT / 2 - 2;
    ball.dx = 0;
    ball.dy = 0;
  }

  // --- Canvas setup (safe because guarded) ---
  function setupCanvas() {
    if (!canvas || !ctx) return;      // <-- the guard that stops the crash
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width  = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';

    scale   = Math.min(w / VIRTUAL_WIDTH, h / VIRTUAL_HEIGHT);
    offsetX = Math.floor((w - VIRTUAL_WIDTH * scale) / 2);
    offsetY = Math.floor((h - VIRTUAL_HEIGHT * scale) / 2);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  // --- Update / Render ---
  function update(dt: number) {
    if (gameState === 'serve') {
      ball.dy = Math.random() * 100 - 50;
      ball.dx = servingPlayer === 1
        ? Math.random() * 60 + 140
        : -(Math.random() * 60 + 140);
    } else if (gameState === 'play') {
      if (collides(ball, player1)) {
        ball.dx = -ball.dx * 1.03;
        ball.x = player1.x + player1.width;
        ball.dy = ball.dy < 0 ? -(Math.random() * 140 + 10) : (Math.random() * 140 + 10);
        sounds.paddle_hit();
      }
      if (collides(ball, player2)) {
        ball.dx = -ball.dx * 1.03;
        ball.x = player2.x - ball.width;
        ball.dy = ball.dy < 0 ? -(Math.random() * 140 + 10) : (Math.random() * 140 + 10);
        sounds.paddle_hit();
      }
      if (ball.y <= 0) { ball.y = 0; ball.dy = -ball.dy; sounds.wall_hit(); }
      if (ball.y >= VIRTUAL_HEIGHT - ball.height) {
        ball.y = VIRTUAL_HEIGHT - ball.height; ball.dy = -ball.dy; sounds.wall_hit();
      }
      if (ball.x < 0) {
        servingPlayer = 1; player2Score += 1; sounds.score();
        if (player2Score === 10) { winningPlayer = 2; gameState = 'done'; }
        else { gameState = 'serve'; resetBall(); }
      }
      if (ball.x > VIRTUAL_WIDTH) {
        servingPlayer = 2; player1Score += 1; sounds.score();
        if (player1Score === 10) { winningPlayer = 1; gameState = 'done'; }
        else { gameState = 'serve'; resetBall(); }
      }
    }

    player1.dy = keys.has('w') ? -PADDLE_SPEED : keys.has('s') ? PADDLE_SPEED : 0;
    player2.dy = keys.has('arrowup') ? -PADDLE_SPEED : keys.has('arrowdown') ? PADDLE_SPEED : 0;

    for (const p of [player1, player2]) {
      if (p.dy < 0) p.y = Math.max(0, p.y + p.dy * dt);
      else           p.y = Math.min(VIRTUAL_HEIGHT - p.height, p.y + p.dy * dt);
    }

    if (gameState === 'play') { ball.x += ball.dx * dt; ball.y += ball.dy * dt; }
  }

  let fps = 0, fpsAccum = 0, fpsFrames = 0;

  function render() {
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    ctx.fillStyle = 'rgb(40, 45, 52)';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

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

    if (gameState === 'start') {
      ctx.font = '8px monospace'; ctx.textAlign = 'center';
      ctx.fillText('Welcome to Pong!', VIRTUAL_WIDTH / 2, 10);
      ctx.fillText('Press Enter to begin!', VIRTUAL_WIDTH / 2, 20);
    } else if (gameState === 'serve') {
      ctx.font = '8px monospace'; ctx.textAlign = 'center';
      ctx.fillText(`Player ${servingPlayer}'s serve!`, VIRTUAL_WIDTH / 2, 10);
      ctx.fillText('Press Enter to serve!', VIRTUAL_WIDTH / 2, 20);
    } else if (gameState === 'done') {
      ctx.font = '16px monospace'; ctx.textAlign = 'center';
      ctx.fillText(`Player ${winningPlayer} wins!`, VIRTUAL_WIDTH / 2, 10);
      ctx.font = '8px monospace';
      ctx.fillText('Press Enter to restart!', VIRTUAL_WIDTH / 2, 30);
    }

    ctx.font = '32px monospace'; ctx.textAlign = 'left';
    ctx.fillText(String(player1Score), VIRTUAL_WIDTH / 2 - 50, VIRTUAL_HEIGHT / 3);
    ctx.fillText(String(player2Score), VIRTUAL_WIDTH / 2 + 30, VIRTUAL_HEIGHT / 3);

    ctx.fillRect(player1.x, player1.y, player1.width, player1.height);
    ctx.fillRect(player2.x, player2.y, player2.width, player2.height);
    ctx.fillRect(ball.x, ball.y, ball.width, ball.height);

    ctx.font = '8px monospace';
    ctx.fillStyle = 'rgb(0,255,0)';
    ctx.fillText('FPS: ' + fps, 10, 10);

    ctx.restore();
  }

  let lastTime = 0;
  function loop(time: number) {
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    fpsAccum += dt; fpsFrames += 1;
    if (fpsAccum >= 0.5) { fps = Math.round(fpsFrames / fpsAccum); fpsAccum = 0; fpsFrames = 0; }
    update(dt);
    render();
    rafId = requestAnimationFrame(loop);
  }

  function onKeyDown(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    if (key === 'arrowup' || key === 'arrowdown' || key === ' ') e.preventDefault();
    keys.add(key);
    if (key === 'enter') {
      if (gameState === 'start') gameState = 'serve';
      else if (gameState === 'serve') gameState = 'play';
      else if (gameState === 'done') {
        gameState = 'serve';
        resetBall();
        player1Score = 0; player2Score = 0;
        servingPlayer = winningPlayer === 1 ? 2 : 1;
      }
    }
  }
  function onKeyUp(e: KeyboardEvent) { keys.delete(e.key.toLowerCase()); }

  // --- Mount: everything that needs the DOM lives here ---
  onMount(() => {
    if (!canvas) return;
    const c2d = canvas.getContext('2d');
    if (!c2d) return;
    ctx = c2d;

    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const unlock = () => {
      if (!audioCtx) {
        const Ctor = window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtx = new Ctor();
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);

    lastTime = performance.now();
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', setupCanvas);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  });
</script>

<canvas bind:this={canvas}></canvas>

<style>
  :global(html, body) {
    margin: 0; padding: 0; background: #000; overflow: hidden; height: 100%;
  }
  canvas { display: block; width: 100vw; height: 100vh; cursor: none; }
</style> -->