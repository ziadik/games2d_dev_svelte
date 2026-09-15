<script lang="ts">
  import Menu from './lib/screens/Menu.svelte';
  import Game from './lib/screens/Pong.svelte';
  import Tablo from './lib/screens/Tablo.svelte';
  import Bird from './lib/screens/Bird.svelte';
  type Screen = 'menu' | 'game' | 'tablo' | 'bird' |string;
  let screen = $state<Screen>('menu');
</script>

{#if screen === 'menu'}
  <Menu onStart={(s) =>{screen = s}} />
    {:else if screen === 'game'}
    <Game onExit={() => screen = 'menu'} />
    {:else if screen === 'tablo'}
    <Tablo onExit={() => screen = 'menu'} />
    {:else if screen === 'bird'}
    <Bird onExit={() => screen = 'menu'} />
{/if}

<style>
  :global(html, body) {
    margin: 0; padding: 0; height: 100%;
    background: #0a0a0a; font-family: monospace; color: #fff;
  }
</style>
