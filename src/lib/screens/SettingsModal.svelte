<script lang="ts">
	interface Props {
		open: boolean;
		fontSize: number;
		fontWeight: number;
		textColor: string;
		bgColor: string;
		onClose: () => void;
		onChange: (key: 'fontSize' | 'fontWeight' | 'textColor' | 'bgColor', value: string | number) => void;
		onReset: () => void;
	}

	let {
		open,
		fontSize,
		fontWeight,
		textColor,
		bgColor,
		onClose,
		onChange,
		onReset
	}: Props = $props();
</script>

<div class="settings-overlay" class:active={open} onclick={onClose}></div>

<div class="settings-modal" class:active={open}>
	<button class="close-settings" onclick={onClose}>✕</button>
	<h3>Настройки вида</h3>

	<div class="setting-row">
		<label>Размер шрифта табло ({fontSize}px)</label>
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
		width: 300px;
		font-family: 'Courier New', Courier, monospace;
	}
	.settings-modal.active {
		display: block;
	}

	.settings-modal h3 {
		margin: 0 0 15px 0;
		border-bottom: 1px solid #444;
		padding-bottom: 5px;
		font-size: 16px;
	}

	.setting-row {
		margin-bottom: 15px;
	}
	.setting-row label {
		display: block;
		margin-bottom: 5px;
		font-size: 14px;
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