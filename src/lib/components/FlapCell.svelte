<script lang="ts">
	interface Props {
		text: string;
		width: number;
		/**
		 * Общая длительность анимации, мс.
		 * Все символы стартуют одновременно и завершаются в пределах этого времени.
		 */
		duration?: number;
	}

	let { text, width, duration = 900 }: Props = $props();

	const CHARS =
		'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-:., ';

	// Плоские $state-массивы — быстрее и надёжнее для реактивности
	let chars = $state<string[]>(Array.from({ length: width }, () => ' '));
	let spinning = $state<boolean[]>(Array.from({ length: width }, () => false));

	// Храним последний отрисованный текст, чтобы не запускать анимацию зря
	let lastTarget = '';

	// ─── Единый эффект: следит за text/width и запускает параллельную анимацию ───
	$effect(() => {
		const target = (text || '').toUpperCase().padEnd(width, ' ');

		// Синхронизируем длину массивов при изменении width
		if (chars.length !== width) {
			chars = Array.from({ length: width }, (_, i) => chars[i] ?? ' ');
			spinning = Array.from({ length: width }, () => false);
			lastTarget = ''; // форсируем перерисовку
		}

		// Ничего не изменилось — выходим (не перезапускаем анимацию)
		if (target === lastTarget) return;
		lastTarget = target;

		// ─── Общая длительность и частота кадров прокрутки ───
		// 60 fps ≈ 16 мс. Берём ~40 мс — компромисс между плавностью и нагрузкой.
		const FRAME_MS = 40;
		// Количество кадров на всю анимацию (одинаково для всех символов)
		const totalFrames = Math.max(3, Math.round(duration / FRAME_MS));

		// Инициализируем «счётчики кадров» для каждого символа
		const framesLeft = new Array<number>(width);
		const needsAnimation = new Array<boolean>(width);

		for (let i = 0; i < width; i++) {
			const targetChar = target[i] ?? ' ';
			if (chars[i] === targetChar) {
				needsAnimation[i] = false;
				framesLeft[i] = 0;
			} else {
				needsAnimation[i] = true;
				// Небольшой разброс, чтобы не все остановились в один кадр:
				// ±20% от totalFrames, но не меньше 3
				const jitter = Math.round(totalFrames * 0.2 * (Math.random() * 2 - 1));
				framesLeft[i] = Math.max(3, totalFrames + jitter);
				spinning[i] = true;
			}
		}

		// Если ни одному символу не нужна анимация — выходим
		if (!needsAnimation.some(Boolean)) return;

		// ─── Один общий интервал на все символы (меньше таймеров → меньше нагрузка) ───
		const timer = setInterval(() => {
			for (let i = 0; i < width; i++) {
				if (!needsAnimation[i]) continue;

				const targetChar = target[i] ?? ' ';
				framesLeft[i]--;

				if (framesLeft[i] <= 0) {
					chars[i] = targetChar;
					spinning[i] = false;
					needsAnimation[i] = false;
				} else {
					chars[i] = CHARS[(Math.random() * CHARS.length) | 0];
				}
			}
		}, FRAME_MS);

		return () => {
			clearInterval(timer);
			// Анимацию прервали — фиксируем финальные символы
			for (let i = 0; i < width; i++) {
				if (needsAnimation[i]) {
					chars[i] = target[i] ?? ' ';
					spinning[i] = false;
				}
			}
		};
	});
</script>

<div class="flap-group">
	{#each Array(width) as _, i (i)}
		<div class="flap-cell">
			<div class="flap-char" class:spinning={spinning[i]}>{chars[i] ?? ' '}</div>
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
		width: var(--flap-cell-width, 16px);
		height: var(--flap-cell-height, 24px);
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
		font-size: var(--flap-cell-font-size, 22px);
		font-weight: var(--flap-font-weight, 700);
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
		/* Ускоряем «мигание» за счёт перехода цвета */
		transition: color 0.08s linear, text-shadow 0.08s linear;
	}
</style>