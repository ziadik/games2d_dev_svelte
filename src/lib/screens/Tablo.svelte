<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import FlapCell from '../components/FlapCell.svelte';
	import SettingsModal from './SettingsModal.svelte';

	interface RawFlight {
		time?: string;
		timedelay?: string;
		codedelay?: string;
		dest?: string;
		company?: string;
		flight?: string;
		hall?: string;
		desk?: string;
		checking?: boolean;
		boarding?: boolean;
		tbrdbegin?: string;
		ex_chkdone?: string;
		tookoff?: string;
	}

	interface NormalizedFlight {
		time: string;
		dest: string;
		flight: string;
		gate: string;
		status: string;
		companyCode: string;
		section: 'dep' | 'arr';
	}

	interface LiveryItem {
		IATACODE?: string;
		IMAGEB64TAIL?: string;
	}

	// 🆕 onExit оставлен для совместимости, но не обязателен
	let { onExit }: { onExit?: () => void } = $props();

	const API_BASE = 'http://172.17.0.19:3002';
	const URL_DEP = `${API_BASE}/get/xalTabloDU`;
	const URL_ARR = `${API_BASE}/get/xalTabloAR`;
	const URL_LIVERIES = `${API_BASE}/getImageAll`;
	const URL_WEATHER = 'http://172.17.0.19:3025/getTemp';

	const REFRESH_INTERVAL = 3_600_000;
	const RETRY_DELAY = 5_000;
	const WEATHER_INTERVAL = 900_000;

	const COL_WIDTHS = { time: 5, dest: 15, flight: 7, gate: 5 } as const;

	let flights = $state<NormalizedFlight[]>([]);
	let isOnline = $state(false);
	let statusText = $state('OFFLINE');
	let statusClass = $state('offline');
	let datetime = $state('--.--.-- --:--:--');
	let weatherTemp = $state('--°C');
	let weatherDesc = $state('--');

	// 🆕 Состояние настроек
	let settingsOpen = $state(false);
	let fontSize = $state(22);
	let fontWeight = $state(700);
	let textColor = $state('#e8c84a');
	let bgColor = $state('#050508');

	let liveriesCache = new Map<string, string>();
	let previousFlightsData: string | null = null;

	let refreshInterval: ReturnType<typeof setInterval> | null = null;
	let retryTimeout: ReturnType<typeof setTimeout> | null = null;
	let clockInterval: ReturnType<typeof setInterval> | null = null;
	let weatherInterval: ReturnType<typeof setInterval> | null = null;

	// 🆕 Загрузка настроек из localStorage
	function loadSettings() {
		if (typeof localStorage === 'undefined') return;
		fontSize = Number(localStorage.getItem('tablo_fontSize') ?? 22);
		fontWeight = Number(localStorage.getItem('tablo_fontWeight') ?? 700);
		textColor = localStorage.getItem('tablo_textColor') ?? '#e8c84a';
		bgColor = localStorage.getItem('tablo_bgColor') ?? '#050508';
	}

	// 🆕 Применение CSS-переменных и шрифтов
	function applySettings() {
		if (typeof document === 'undefined') return;
		const root = document.documentElement;
		root.style.setProperty('--text-color', textColor);
		root.style.setProperty('--bg-color', bgColor);
		root.style.setProperty('--flap-font-size', `${fontSize}px`);
		root.style.setProperty('--flap-font-weight', String(fontWeight));

		// Применяем ко всем flap-char и status-text
		document.querySelectorAll<HTMLElement>('.flap-char, .status-text').forEach((el) => {
			el.style.fontSize = `${fontSize}px`;
			el.style.fontWeight = String(fontWeight);
		});
	}

	// 🆕 Обработчик изменений из модалки
	function handleSettingChange(
		key: 'fontSize' | 'fontWeight' | 'textColor' | 'bgColor',
		value: string | number
	) {
		if (key === 'fontSize') fontSize = Number(value);
		if (key === 'fontWeight') fontWeight = Number(value);
		if (key === 'textColor') textColor = String(value);
		if (key === 'bgColor') bgColor = String(value);

		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('tablo_' + key, String(value));
		}
		applySettings();
	}

	// 🆕 Сброс настроек
	function resetSettings() {
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem('tablo_fontSize');
			localStorage.removeItem('tablo_fontWeight');
			localStorage.removeItem('tablo_textColor');
			localStorage.removeItem('tablo_bgColor');
		}
		fontSize = 22;
		fontWeight = 700;
		textColor = '#e8c84a';
		bgColor = '#050508';
		applySettings();
	}

	function parseDestination(destStr?: string): string {
		if (!destStr) return 'НЕИЗВЕСТНО'.padEnd(COL_WIDTHS.dest, ' ');
		return destStr.split('%')[0].toUpperCase().padEnd(COL_WIDTHS.dest, ' ');
	}

	function getStatusDep(flight: RawFlight): string {
		const parts: string[] = [];
		if (flight.timedelay && flight.time !== flight.timedelay) {
			let delayText = flight.codedelay
				? flight.codedelay.replace(/[^а-яА-Яa-zA-Z0-9\s]/g, '').trim()
				: 'Задержан';
			if (delayText.toLowerCase().includes('поздн')) delayText = 'Позднее прибытие';
			parts.push(`${delayText} | Задержан до ${flight.timedelay}`);
		} else {
			if (flight.ex_chkdone === 'DONE') {
				if (flight.tbrdbegin || flight.boarding) parts.push('Посадка');
			} else if (flight.checking) {
				parts.push('Регистрация');
			}
		}
		return parts.join(' ');
	}

	function getStatusArr(flight: RawFlight): string {
		if (flight.timedelay && flight.time !== flight.timedelay) {
			if (flight.timedelay > flight.time!) {
				const delayText = flight.codedelay
					? flight.codedelay.replace(/[^а-яА-Яa-zA-Z0-9\s]/g, '').trim()
					: 'ЗАДЕРЖАН';
				return `${delayText} ${flight.timedelay}`;
			}
			return `ОЖИДАЕТСЯ В ${flight.timedelay}`;
		}
		if (flight.tookoff === 'ВЫЛ') return 'В ПУТИ';
		if (flight.tookoff === 'НЕВ') return 'НЕ ВЫЛЕТЕЛ';
		return '';
	}

	function normalizeFlight(raw: RawFlight, type: 'dep' | 'arr'): NormalizedFlight {
		const isDep = type === 'dep';
		const company = (raw.company || '').trim();
		const flightNum = (raw.flight || '').trim();

		const gate = isDep
			? raw.hall
				? raw.hall + (raw.desk && raw.desk !== '-' ? ' / ' + raw.desk : '')
				: raw.desk || '-'
			: raw.hall || '-';

		return {
			time: (raw.time || '--:--').padEnd(COL_WIDTHS.time, ' '),
			dest: parseDestination(raw.dest),
			flight: (company + ' ' + flightNum).trim().padEnd(COL_WIDTHS.flight, ' '),
			gate: gate.padEnd(COL_WIDTHS.gate, ' '),
			status: isDep ? getStatusDep(raw) : getStatusArr(raw),
			companyCode: company,
			section: type
		};
	}

	async function loadLiveries() {
		try {
			const response = await fetch(URL_LIVERIES);
			if (!response.ok) throw new Error('Failed to load liveries');
			const data: LiveryItem[] = await response.json();
			liveriesCache.clear();
			data.forEach((item) => {
				if (item.IATACODE && item.IMAGEB64TAIL) {
					liveriesCache.set(
						item.IATACODE.toUpperCase(),
						`data:image/png;base64,${item.IMAGEB64TAIL}`
					);
				}
			});
		} catch (err) {
			console.error('Ошибка загрузки ливрей:', err);
		}
	}

	function getLiveryUrl(companyCode: string): string | null {
		if (!companyCode) return null;
		return liveriesCache.get(companyCode.toUpperCase().trim()) || null;
	}

	async function loadWeather() {
		try {
			const response = await fetch(URL_WEATHER);
			if (!response.ok) throw new Error('Weather API error');
			const data = await response.json();
			if (data.weather) {
				weatherTemp = `${data.weather.temperature}°C`;
				weatherDesc = (data.metaDescription || data.weather.airportName || '').toUpperCase();
			}
		} catch (err) {
			console.error('Ошибка загрузки погоды:', err);
		}
	}

	function updateClock() {
		const now = new Date();
		const dd = String(now.getDate()).padStart(2, '0');
		const mm = String(now.getMonth() + 1).padStart(2, '0');
		const yy = String(now.getFullYear()).slice(-2);
		const hh = String(now.getHours()).padStart(2, '0');
		const mi = String(now.getMinutes()).padStart(2, '0');
		const ss = String(now.getSeconds()).padStart(2, '0');
		datetime = `${dd}.${mm}.${yy}  ${hh}:${mi}:${ss}`;
	}

	async function fetchAndRender() {
		try {
			if (!navigator.onLine) throw new Error('Нет подключения к сети');

			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10_000);

			const [depRes, arrRes] = await Promise.all([
				fetch(URL_DEP, { signal: controller.signal }),
				fetch(URL_ARR, { signal: controller.signal })
			]);
			clearTimeout(timeoutId);

			if (!depRes.ok || !arrRes.ok) throw new Error('HTTP error');

			const depData: RawFlight[] = await depRes.json();
			const arrData: RawFlight[] = await arrRes.json();

			const allFlights: NormalizedFlight[] = [
				...depData.map((d) => normalizeFlight(d, 'dep')),
				...arrData.map((d) => normalizeFlight(d, 'arr'))
			];

			const currentDataString = JSON.stringify(
				allFlights.map((f) => ({
					f: f.flight,
					t: f.time,
					d: f.dest,
					s: f.status,
					g: f.gate
				}))
			);

			if (previousFlightsData === currentDataString) return;
			previousFlightsData = currentDataString;

			if (!isOnline) {
				isOnline = true;
				if (refreshInterval) clearInterval(refreshInterval);
				refreshInterval = setInterval(fetchAndRender, REFRESH_INTERVAL);
			}

			statusText = 'ONLINE';
			statusClass = 'online';
			flights = allFlights;

			// 🆕 Переприменяем настройки после рендера новых строк
			requestAnimationFrame(applySettings);
		} catch (err) {
			console.error('Ошибка:', err);
			statusText = 'ERROR';
			statusClass = 'offline';
			isOnline = false;
			if (refreshInterval) {
				clearInterval(refreshInterval);
				refreshInterval = null;
			}
			if (retryTimeout) clearTimeout(retryTimeout);
			retryTimeout = setTimeout(fetchAndRender, RETRY_DELAY);
		}
	}

	function handleNetworkChange(e: Event) {
    console.log('[network]', e.type, 'navigator.onLine =', navigator.onLine);
		if (navigator.onLine) {
			statusText = 'RECONNECTING...';
			statusClass = 'offline';
			if (retryTimeout) clearTimeout(retryTimeout);
			fetchAndRender();
      statusText = 'ONLINE';
			statusClass = 'online';
		} else {
			statusText = 'OFFLINE';
			statusClass = 'offline';
			isOnline = false;
			if (refreshInterval) {
				clearInterval(refreshInterval);
				refreshInterval = null;
			}
		}
	}

	onMount(() => {
		// 🆕 Загружаем и применяем настройки
		loadSettings();
		applySettings();

		window.addEventListener('online', handleNetworkChange);
		window.addEventListener('offline', handleNetworkChange);

		updateClock();
		clockInterval = setInterval(updateClock, 1000);

		loadLiveries().then(() => {
			loadWeather();
			weatherInterval = setInterval(loadWeather, WEATHER_INTERVAL);
			fetchAndRender();
		});

		return () => {
			window.removeEventListener('online', handleNetworkChange);
			window.removeEventListener('offline', handleNetworkChange);
		};
	});

	onDestroy(() => {
		if (refreshInterval) clearInterval(refreshInterval);
		if (retryTimeout) clearTimeout(retryTimeout);
		if (clockInterval) clearInterval(clockInterval);
		if (weatherInterval) clearInterval(weatherInterval);
	});

	const sections = $derived.by(() => {
		const result: { title: string; section: 'dep' | 'arr'; items: NormalizedFlight[] }[] = [];
		let lastSection: 'dep' | 'arr' | null = null;
		for (const f of flights) {
			if (f.section !== lastSection) {
				result.push({
					title: f.section === 'arr' ? 'ПРИЛЕТ' : 'ВЫЛЕТ',
					section: f.section,
					items: []
				});
				lastSection = f.section;
			}
			result[result.length - 1].items.push(f);
		}
		return result;
	});
</script>

<!-- 🆕 Модальное окно настроек -->
<SettingsModal
	open={settingsOpen}
	fontSize={fontSize}
	fontWeight={fontWeight}
	textColor={textColor}
	bgColor={bgColor}
	onClose={() => (settingsOpen = false)}
	onChange={handleSettingChange}
	onReset={resetSettings}
/>

<div class="board">
	<button class="settings-btn" onclick={() => (settingsOpen = true)}>⚙ Настройки</button>
	<div class="conn-status {statusClass}">{statusText}</div>

	<div class="top-panel">
		<div class="weather-widget">
			<span class="weather-temp">{weatherTemp}</span>
			<span style="font-size: 0.5em; opacity: 0.9; text-transform: uppercase;">{weatherDesc}</span>
		</div>
		<div class="datetime-header">{datetime}</div>
	</div>

	<div class="col-headers">
		<span></span>
		<span>Время</span>
		<span>Направление</span>
		<span>Рейс</span>
		<span>Терм./Ст.</span>
		<span>Статус</span>
	</div>

	<div class="flights">
		{#if flights.length > 0}
			{#each sections as section (section.section)}
				<div class="section-divider">{section.title}</div>
				{#each section.items as flight (`${flight.flight}|${flight.time}|${flight.dest}`)}
					<div class="flight-row">
						<div class="airline-logo">
							{#if getLiveryUrl(flight.companyCode)}
								<img src={getLiveryUrl(flight.companyCode)!} alt={flight.companyCode} />
							{/if}
						</div>

						<FlapCell text={flight.time} width={COL_WIDTHS.time} />
						<FlapCell text={flight.dest} width={COL_WIDTHS.dest} />
						<FlapCell text={flight.flight} width={COL_WIDTHS.flight} />
						<FlapCell text={flight.gate} width={COL_WIDTHS.gate} />

						<div class="status-container" class:scrolling={flight.status.length > 25}>
							<div class="marquee-wrapper">
								{#if flight.status.length > 25}
									<span class="status-text">{flight.status}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
									<span class="status-text">{flight.status}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
								{:else}
									<span class="status-text">{flight.status}</span>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			{/each}
		{:else if isOnline}
			<div class="empty">Нет рейсов</div>
		{:else}
			<div class="loading">Загрузка данных...</div>
		{/if}
	</div>

	<div class="footer">
		<p class="copyright">© 2026 ООО «ААА»</p>
		<p style="margin-top: 5px; font-size: 0.75rem; opacity: 0.8;">
			Разработка сайта: <a href="https://ziidik.ru" target="_blank" rel="noopener">VARTA_DEV</a>
		</p>
	</div>
</div>

<style>
	:global(:root) {
		--bg-color: #050508;
		--board-bg-top: #0f0f16;
		--board-bg-bottom: #08080c;
		--text-color: #e8c84a;
		--text-shadow: rgba(232, 200, 74, 0.4);
		--flap-bg: #1a1a24;
		--flap-cell-bg: #15151e;
		--flap-font-size: 22px;
		--flap-font-weight: 700;
	}

	:global(body) {
		background: var(--bg-color);
		color: var(--text-color);
		font-family: 'Courier New', Courier, monospace;
		min-height: 100vh;
		display: flex;
		justify-content: center;
		padding: 10px;
		overflow-x: hidden;
		transition: background 0.3s;
	}

	.board {
		width: 100%;
		max-width: 1400px;
		background: linear-gradient(180deg, var(--board-bg-top) 0%, var(--board-bg-bottom) 100%);
		border: 1px solid #2a2a35;
		border-radius: 4px;
		padding: 12px;
		box-shadow: 0 0 40px rgba(0, 0, 0, 0.8), inset 0 0 80px rgba(0, 0, 0, 0.9);
		position: relative;
	}

	.board::before {
		content: ' ';
		display: block;
		position: absolute;
		inset: 0;
		background:
			linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
			linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
		z-index: 10;
		background-size: 100% 2px, 3px 100%;
		pointer-events: none;
		opacity: 0.6;
		border-radius: 4px;
	}

	.settings-btn {
		position: absolute;
		top: 5px;
		left: 60px;
		z-index: 20;
		background: rgba(0, 0, 0, 0.5);
		border: 1px solid #444;
		color: #fff;
		cursor: pointer;
		padding: 5px 10px;
		border-radius: 4px;
		font-size: 14px;
		opacity: 0.5;
		transition: opacity 0.3s;
	}
	.settings-btn:hover {
		opacity: 1;
	}

	.top-panel {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 12px;
		padding-right: 5px;
	}

	.datetime-header {
		font-size: 40px;
		letter-spacing: 3px;
		color: var(--text-color);
		text-shadow: 0 0 4px var(--text-shadow);
		font-weight: bold;
	}

	.weather-widget {
		display: flex;
		align-items: center;
		gap: 15px;
		font-size: 40px;
		color: #b8a83a;
		text-shadow: 0 0 4px rgba(184, 168, 58, 0.3);
	}

	.weather-temp {
		font-weight: bold;
		font-size: 60px;
	}

	.col-headers {
		display: grid;
		grid-template-columns: 40px 60px 1fr 80px 55px 2fr;
		gap: 3px;
		margin-bottom: 5px;
		border-bottom: 2px solid #333;
		padding-bottom: 3px;
	}

	.col-headers span {
		font-size: 18px;
		letter-spacing: 1px;
		color: #b8a83a;
		text-transform: uppercase;
		text-align: center;
		font-weight: bold;
		padding: 0 2px;
	}

	.section-divider {
		margin: 8px 0 3px 0;
		padding: 2px 5px;
		background: var(--flap-cell-bg);
		border-left: 3px solid var(--text-color);
		font-size: 23px;
		font-weight: bold;
		letter-spacing: 2px;
		color: #fff;
		text-transform: uppercase;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
	}

	.flights {
		display: flex;
		flex-direction: column;
	}

	.flight-row {
		display: grid;
		grid-template-columns: 40px 60px 1fr 80px 55px 2fr;
		gap: 15px;
		align-items: center;
	}

	.airline-logo {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 26px;
		width: 40px;
	}

	.airline-logo img {
		max-height: 24px;
		max-width: 36px;
		object-fit: contain;
		filter: drop-shadow(0 0 2px var(--text-shadow));
	}

	.status-container {
		height: 24px;
		overflow: hidden;
		white-space: nowrap;
		position: relative;
		background: var(--flap-cell-bg);
		border-radius: 2px;
		display: flex;
		align-items: center;
	}

	.marquee-wrapper {
		display: flex;
		white-space: nowrap;
		will-change: transform;
	}

	.status-text {
		font-size: var(--flap-font-size, 20px);
		font-weight: var(--flap-font-weight, bold);
		color: var(--text-color);
		text-shadow: 0 0 3px var(--text-shadow);
		padding-right: 50px;
		display: inline-block;
	}

	@keyframes scroll-infinite {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-50%);
		}
	}

	.status-container.scrolling .marquee-wrapper {
		animation: scroll-infinite 15s linear infinite;
	}

	.conn-status {
		position: absolute;
		top: 12px;
		left: 12px;
		font-size: 10px;
		color: #555;
		text-transform: uppercase;
		letter-spacing: 1px;
	}
	.conn-status.online {
		color: #4a8;
		text-shadow: 0 0 4px rgba(68, 170, 136, 0.5);
	}
	.conn-status.offline {
		color: #a44;
		text-shadow: 0 0 4px rgba(170, 68, 68, 0.5);
	}

	.footer {
		margin-top: 20px;
		padding-top: 15px;
		border-top: 1px solid #2a2a35;
		text-align: center;
		color: #888;
		font-size: 12px;
	}

	.footer .copyright {
		margin: 0;
		font-size: 12px;
	}
	.footer a {
		color: white;
		text-decoration: none;
		transition: opacity 0.3s;
	}
	.footer a:hover {
		opacity: 0.7;
		text-decoration: underline;
	}

	.loading,
	.empty {
		text-align: center;
		padding: 20px;
		color: #666;
		font-size: 18px;
	}

	@media (max-width: 800px) {
		.board {
			padding: 8px;
			border-radius: 0;
			border-left: none;
			border-right: none;
		}
		.top-panel {
			flex-direction: column-reverse;
			align-items: center;
			gap: 10px;
		}
		.weather-widget {
			font-size: 18px;
		}
		.weather-temp {
			font-size: 50px;
		}
		.col-headers {
			display: none;
		}
		.flight-row {
			grid-template-columns: 30px 42px 1fr 65px;
			gap: 3px;
			margin-bottom: 4px;
			border-bottom: 1px solid #1a1a24;
			padding-bottom: 4px;
		}
		.flight-row > :nth-child(4),
		.flight-row > :nth-child(5) {
			display: none;
		}
		.airline-logo {
			height: 22px;
			width: 30px;
		}
		.airline-logo img {
			max-height: 20px;
			max-width: 28px;
		}
		.datetime-header {
			font-size: 32px;
			text-align: center;
			letter-spacing: 2px;
		}
		.conn-status {
			position: static;
			text-align: center;
			margin-bottom: 8px;
			display: block;
		}
		.section-divider {
			font-size: 21px;
			padding: 2px 4px;
			margin: 8px 0 2px 0;
		}
		.footer {
			margin-top: 15px;
			padding-top: 10px;
			font-size: 10px;
		}
		.footer .copyright {
			font-size: 10px;
		}
	}

	@media (max-width: 380px) {
		.flight-row {
			grid-template-columns: 25px 36px 1fr 55px;
		}
		.airline-logo {
			height: 19px;
			width: 25px;
		}
		.airline-logo img {
			max-height: 17px;
			max-width: 23px;
		}
	}
</style>