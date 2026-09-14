<script lang="ts">
	interface Props {
		text: string;
		width: number;
	}

	let { text, width }: Props = $props();

	const CHARS =
		'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-:., ';

	type Cell = { current: string; spinning: boolean };

	let cells = $state<Cell[]>(
		Array.from({ length: width }, () => ({ current: ' ', spinning: false }))
	);

	// Пересоздаём массив, если ширина изменилась
	$effect(() => {
		if (cells.length !== width) {
			cells = Array.from({ length: width }, () => ({ current: ' ', spinning: false }));
		}
	});

	// Запускаем анимацию при изменении текста
	$effect(() => {
		const target = (text || '').toUpperCase().padEnd(width, ' ');

		for (let i = 0; i < width; i++) {
			const targetChar = target[i] ?? ' ';
			const cell = cells[i];
			if (!cell) continue;
			if (cell.current === targetChar || cell.spinning) continue;

			cell.spinning = true;
			const maxIterations = 3 + Math.floor(Math.random() * 5);
			let iterations = 0;

			const interval = setInterval(() => {
				cell.current = CHARS[Math.floor(Math.random() * CHARS.length)];
				iterations++;
				if (iterations >= maxIterations) {
					clearInterval(interval);
					cell.current = targetChar;
					cell.spinning = false;
				}
			}, 45);
		}
	});
</script>

<div class="flap-group">
	{#each cells as cell, i (i)}
		<div class="flap-cell">
			<div class="flap-char" class:spinning={cell.spinning}>{cell.current}</div>
		</div>
	{/each}
</div>

<style>
	.flap-group {
		display: flex;
		gap: 1px;
	}

	.flap-cell {
		position: relative;
		height: 24px;
		width: 16px;
		perspective: 300px;
		background: var(--flap-cell-bg, #15151e);
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.flap-char {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 22px;
		font-weight: bold;
		color: var(--text-color, #e8c84a);
		background: var(--flap-bg, #1a1a24);
		backface-visibility: hidden;
		text-shadow: 0 0 3px var(--text-shadow, rgba(232, 200, 74, 0.4));
		overflow: hidden;
		box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.5);
	}

	.flap-char::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		height: 1px;
		background: rgba(0, 0, 0, 0.6);
		z-index: 2;
	}

	.flap-char.spinning {
		color: #fff;
		text-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
	}

	@media (max-width: 800px) {
		.flap-cell {
			height: 24px;
			width: 16px;
			min-width: 14px;
		}
		.flap-char {
			font-size: 13px;
		}
	}

	@media (max-width: 380px) {
		.flap-cell {
			height: 19px;
			width: 12px;
			min-width: 12px;
		}
		.flap-char {
			font-size: 11px;
		}
	}
</style>