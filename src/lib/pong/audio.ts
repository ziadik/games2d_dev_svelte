import type { SoundName } from "./types";

let audioCtx: AudioContext | null = null;

/** Вызвать один раз после первого пользовательского действия. */
export function unlockAudio(): void {
  if (audioCtx) return;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  audioCtx = new Ctor();
}

function beep(
  freq: number,
  duration: number,
  type: OscillatorType = "square",
  gain = 0.06,
): void {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

export function playSound(name: SoundName): void {
  switch (name) {
    case "paddle_hit":
      return beep(440, 0.05);
    case "wall_hit":
      return beep(220, 0.05);
    case "score":
      return beep(120, 0.2, "sawtooth", 0.08);
  }
}
