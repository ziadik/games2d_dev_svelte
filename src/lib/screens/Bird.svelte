<script lang="ts">
  import { onMount } from 'svelte';
  import { loadAssets, getAssets, playSound } from '../bird/engine/assets';
  import { input } from '../bird/engine/input';
  import { StateMachine } from '../bird/engine/stateMachine.svelte';
  import {
    VIRTUAL_WIDTH,
    VIRTUAL_HEIGHT,
    BACKGROUND_SCROLL_SPEED,
    GROUND_SCROLL_SPEED,
    BACKGROUND_LOOPING_POINT,
  } from '../bird/engine/constants';
  import { TitleScreenState } from '../bird/states/TitleScreenState';
  import { CountdownState } from '../bird/states/CountdownState';
  import { PlayState } from '../bird/states/PlayState';
  import { ScoreState } from '../bird/states/ScoreState';

  let canvas: HTMLCanvasElement;
  let loaded = $state(false);
  let scaledWidth = $state(VIRTUAL_WIDTH);
  let scaledHeight = $state(VIRTUAL_HEIGHT);

  let backgroundScroll = 0;
  let groundScroll = 0;
  let scrolling = true;

  let stateMachine: StateMachine;

  let { onExit }: { onExit?: () => void } = $props();

  async function init() {
    await loadAssets('/');

    const sm = new StateMachine({
      title: () => new TitleScreenState(() => sm.change('countdown')),
      countdown: () => new CountdownState(() => sm.change('play')),
      play: () =>
        new PlayState({
          onChangeToScore: (score) => sm.change('score', { score }),
        }),
      score: () => new ScoreState(() => sm.change('countdown')),
    });

    stateMachine = sm;
    sm.change('title');

    // музыка
    const music = getAssets().sounds.music;
    music.volume = 0.5;
    music.play().catch(() => {});

    loaded = true;
  }

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const scale = Math.min(
      window.innerWidth / VIRTUAL_WIDTH,
      window.innerHeight / VIRTUAL_HEIGHT
    );
    const w = Math.floor(VIRTUAL_WIDTH * scale);
    const h = Math.floor(VIRTUAL_HEIGHT * scale);

    scaledWidth = w;
    scaledHeight = h;

    canvas.width = VIRTUAL_WIDTH * dpr;
    canvas.height = VIRTUAL_HEIGHT * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  let lastTime = 0;
  let raf = 0;

  function loop(t: number) {
    const dt = Math.min((t - lastTime) / 1000, 1 / 30);
    lastTime = t;

    update(dt);
    draw();

    input.endFrame();
    raf = requestAnimationFrame(loop);
  }

  function update(dt: number) {
    if (scrolling) {
      backgroundScroll =
        (backgroundScroll + BACKGROUND_SCROLL_SPEED * dt) % BACKGROUND_LOOPING_POINT;
      groundScroll = (groundScroll + GROUND_SCROLL_SPEED * dt) % VIRTUAL_WIDTH;
    }
    stateMachine.update(dt);
  }

  function draw() {
    const ctx = canvas.getContext('2d')!;
    const a = getAssets();

    // фон
    ctx.drawImage(a.textures.background, -backgroundScroll, 0);

    // состояние
    stateMachine.render({ ctx, width: VIRTUAL_WIDTH, height: VIRTUAL_HEIGHT });

    // земля
    ctx.drawImage(a.textures.ground, -groundScroll, VIRTUAL_HEIGHT - 16);
  }

  onMount(() => {
    resizeCanvas();
    init().then(() => {
      lastTime = performance.now();
      raf = requestAnimationFrame(loop);
    });

    window.addEventListener('resize', resizeCanvas);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resizeCanvas);
    };
  });
</script>

{#if !loaded}
  <div class="loading">Loading...</div>
{/if}

<button class="back" onclick={onExit}>← Меню</button>
<div class="game" style:width="{scaledWidth}px" style:height="{scaledHeight}px">
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  :global(html, body) {
    margin: 0;
    padding: 0;
    background: #000;
    height: 100%;
    overflow: hidden;
    font-family: sans-serif;
  }

  .game {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100vw;
    height: 100vh;
    margin: 0 auto;
  }

  canvas {
    display: block;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
  }

  .loading {
    color: #fff;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
</style>