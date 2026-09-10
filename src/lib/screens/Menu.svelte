<script lang="ts">
  let { onStart }: { onStart: () => void } = $props();
</script>

<div class="menu">
  <h1>PONG</h1>
  <p>Классика 1972 года</p>
  <button onclick={onStart}>Играть</button>
</div>

<style>
  .menu {
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }
  h1 {
    font-size: 4rem;
    margin: 0;
    letter-spacing: 0.2em;
  }
  p {
    color: #888;
    margin: 0;
  }
  button {
    margin-top: 2rem;
    padding: 0.75rem 2rem;
    font-size: 1.25rem;
    font-family: inherit;
    background: transparent;
    color: #fff;
    border: 2px solid #fff;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  button:hover {
    background: #fff;
    color: #0a0a0a;
  }
</style>