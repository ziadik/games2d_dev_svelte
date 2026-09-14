<script lang="ts">
  import Menu from './lib/screens/Menu.svelte';
  // import Game from './lib/screens/Pong.svelte';
  import Tablo from './lib/screens/Tablo.svelte';
  type Screen = 'menu' | 'game';
  let screen = $state<Screen>('menu');
</script>

{#if screen === 'menu'}
  <Menu onStart={() => screen = 'game'} />
    {:else}
    <Tablo onExit={() => screen = 'menu'} />
  <!-- <Game onExit={() => screen = 'menu'} /> -->
{/if}

<style>
  :global(html, body) {
    margin: 0; padding: 0; height: 100%;
    background: #0a0a0a; font-family: monospace; color: #fff;
  }
</style>
