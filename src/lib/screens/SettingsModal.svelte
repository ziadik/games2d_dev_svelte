<script lang="ts">
	interface Props {
		open: boolean;
		fontSize: number;
		fontWeight: number;
		textColor: string;
		bgColor: string;
		cellWidth: number;
		cellHeight: number;
		cellFontSize: number;
		onClose: () => void;
		onChange: (
			key:
				| 'fontSize'
				| 'fontWeight'
				| 'textColor'
				| 'bgColor'
				| 'cellWidth'
				| 'cellHeight'
				| 'cellFontSize',
			value: string | number
		) => void;
		onReset: () => void;
	}

	let {
		open,
		fontSize,
		fontWeight,
		textColor,
		bgColor,
		cellWidth,
		cellHeight,
		cellFontSize,
		onClose,
		onChange,
		onReset
	}: Props = $props();
</script>

<div class="settings-overlay" class:active={open} onclick={onClose}></div>

<div class="settings-modal" class:active={open}>
	<button class="close-settings" onclick={onClose}>✕</button>
	<h3>Настройки вида</h3>

	<div class="settings-scroll">
		<!-- ─── Статус ───────────────────────────────────────────── -->
		<div class="setting-group">
			<div class="setting-group-title">Статус</div>

			<div class="setting-row">
				<label>Размер шрифта статуса ({fontSize}px)</label>
				<input
					type="range"
					min="10"
					max="40"
					value={fontSize}
					oninput={(e) => onChange('fontSize', Number((e.target as HTMLInputElement).value))}
				/>
			</div>

			<div class="setting-row">
				<label>Жирность шрифта ({fontWeight})</label>
				<input
					type="range"
					min="100"
					max="900"
					step="100"
					value={fontWeight}
					oninput={(e) => onChange('fontWeight', Number((e.target as HTMLInputElement).value))}
				/>
			</div>
		</div>

		<!-- ─── Ячейки табло ─────────────────────────────────────── -->
		<div class="setting-group">
			<div class="setting-group-title">Ячейки табло</div>

			<div class="setting-row">
				<label>Ширина ячейки ({cellWidth}px)</label>
				<input
					type="range"
					min="8"
					max="40"
					value={cellWidth}
					oninput={(e) => onChange('cellWidth', Number((e.target as HTMLInputElement).value))}
				/>
			</div>

			<div class="setting-row">
				<label>Высота ячейки ({cellHeight}px)</label>
				<input
					type="range"
					min="12"
					max="60"
					value={cellHeight}
					oninput={(e) => onChange('cellHeight', Number((e.target as HTMLInputElement).value))}
				/>
			</div>

			<div class="setting-row">
				<label>Размер шрифта в ячейке ({cellFontSize}px)</label>
				<input
					type="range"
					min="8"
					max="48"
					value={cellFontSize}
					oninput={(e) =>
						onChange('cellFontSize', Number((e.target as HTMLInputElement).value))}
				/>
			</div>

			<div class="preview-label">Предпросмотр:</div>
			<div class="preview-row">
				{#each 'AB123' as ch, i (i)}
					<div
						class="preview-cell"
						style="
							width: {cellWidth}px;
							height: {cellHeight}px;
							font-size: {cellFontSize}px;
							font-weight: {fontWeight};
							color: {textColor};
						"
					>
						{ch}
					</div>
				{/each}
			</div>
		</div>

		<!-- ─── Цвета ────────────────────────────────────────────── -->
		<div class="setting-group">
			<div class="setting-group-title">Цвета</div>

			<div class="setting-row">
				<label>Цвет букв</label>
				<input
					type="color"
					value={textColor}
					oninput={(e) => onChange('textColor', (e.target as HTMLInputElement).value)}
				/>
			</div>

			<div class="setting-row">
				<label>Цвет фона</label>
				<input
					type="color"
					value={bgColor}
					oninput={(e) => onChange('bgColor', (e.target as HTMLInputElement).value)}
				/>
			</div>
		</div>
	</div>

	<button class="reset-btn" onclick={onReset}>Сбросить настройки</button>
</div>

<style>
	.settings-overlay {
		display: none;
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		z-index: 99;
	}
	.settings-overlay.active {
		display: block;
	}

	.settings-modal {
		display: none;
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: #1a1a24;
		border: 1px solid #444;
		padding: 20px;
		z-index: 100;
		border-radius: 8px;
		box-shadow: 0 0 20px rgba(0, 0, 0, 0.9);
		color: #fff;
		width: 340px;
		max-height: 90vh;
		flex-direction: column;
		font-family: 'Courier New', Courier, monospace;
	}
	.settings-modal.active {
		display: flex;
	}

	.settings-modal h3 {
		margin: 0 0 15px 0;
		border-bottom: 1px solid #444;
		padding-bottom: 5px;
		font-size: 16px;
	}

	.settings-scroll {
		overflow-y: auto;
		flex: 1;
		padding-right: 4px;
		margin-bottom: 10px;
	}

	.setting-group {
		margin-bottom: 18px;
		padding-bottom: 12px;
		border-bottom: 1px dashed #333;
	}
	.setting-group:last-child {
		border-bottom: none;
	}

	.setting-group-title {
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 1px;
		color: #888;
		margin-bottom: 10px;
	}

	.setting-row {
		margin-bottom: 12px;
	}
	.setting-row label {
		display: block;
		margin-bottom: 5px;
		font-size: 13px;
	}
	.setting-row input[type='range'] {
		width: 100%;
	}
	.setting-row input[type='color'] {
		width: 100%;
		height: 30px;
		border: none;
		cursor: pointer;
		background: none;
	}

	.preview-label {
		font-size: 12px;
		color: #888;
		margin: 8px 0 5px;
	}
	.preview-row {
		display: flex;
		gap: 2px;
		background: #050508;
		padding: 6px;
		border-radius: 4px;
		justify-content: center;
	}
	.preview-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		background: #1a1a24;
		font-weight: bold;
		position: relative;
		overflow: hidden;
		flex-shrink: 0;
	}
	.preview-cell::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		height: 1px;
		background: rgba(0, 0, 0, 0.6);
	}

	.close-settings {
		background: #333;
		color: white;
		border: none;
		padding: 5px 10px;
		cursor: pointer;
		float: right;
		border-radius: 4px;
	}
	.close-settings:hover {
		background: #444;
	}

	.reset-btn {
		width: 100%;
		padding: 8px;
		background: #552222;
		color: white;
		border: none;
		cursor: pointer;
		border-radius: 4px;
		font-family: inherit;
	}
	.reset-btn:hover {
		background: #6a2a2a;
	}
</style>