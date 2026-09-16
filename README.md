# Fifty Bird

Ремейк Flappy Bird на Svelte 5 + TypeScript с рендером через Canvas 2D.

## Управление
- **Space** / **ЛКМ** — взмах крыльев
- **Enter** — старт / рестарт
- **Esc** — выход (в браузере — закрыть вкладку)

## Запуск
```bash
npm install
npm run dev
Ассеты (спрайты, звуки, шрифты) положить в static/ (или public/).

Структура
engine/ — FSM, ввод, ассеты, константы

entities/ — Bird, Pipe, PipePair

states/ — сцены игры

FSM
Одно активное состояние, остальные — фабрики в StateMachine.states.

ts
change(name, params):
  current.exit?.()
  current = states[name]()
  current.enter?.(params)
Жизненный цикл состояния:

Хук	Когда	Зачем
enter(params)	после создания	получить данные, настроить сцену
update(dt)	каждый кадр	игровая логика
render(rc)	каждый кадр	отрисовка
exit()	перед сменой	сайд-эффекты
Поток:

text
title ──Enter──► countdown ──3..2..1──► play
                  ▲                       │
                  │                       │ смерть
                  └────Enter──────────── score
Состояния не знают друг о друге — переходы через колбэки (onEnter, onComplete, onChangeToScore, onRestart), передаваемые из Game.svelte.

Ввод
InputManager прячет асинхронные keydown/keyup за синхронным API:

keysDown — зажатые сейчас

keysPressed — нажатия текущего кадра (сброс в endFrame() в конце игрового цикла)

ts
if (input.wasKeyPressed('Enter')) sm.change('countdown');
if (input.wasKeyPressed(' ') || input.wasMousePressed(0)) bird.flap();
Автоповтор keydown игнорируется: в keysPressed пишем только при первом нажатии.

Игровой цикл
text
requestAnimationFrame ──► update(dt) ──► draw() ──► input.endFrame()