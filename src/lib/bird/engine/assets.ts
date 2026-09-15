export interface Assets {
  textures: {
    background: HTMLImageElement;
    ground: HTMLImageElement;
    bird: HTMLImageElement;
    pipe: HTMLImageElement;
  };
  sounds: {
    jump: HTMLAudioElement;
    explosion: HTMLAudioElement;
    hurt: HTMLAudioElement;
    score: HTMLAudioElement;
    music: HTMLAudioElement;
  };
}

let assets: Assets | null = null;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error(`Не удалось загрузить изображение: ${src}`));
    img.src = src;
  });
}

function loadAudio(src: string, loop = false): HTMLAudioElement {
  const audio = new Audio();
  audio.loop = loop;
  audio.preload = "auto";
  audio.src = src;
  // аудио грузится лениво, ошибки ловим здесь
  audio.addEventListener("error", () => {
    console.error(`Не удалось загрузить аудио: ${src}`);
  });
  return audio;
}

export async function loadAssets(basePath = "/"): Promise<Assets> {
  const [background, ground, bird, pipe] = await Promise.all([
    loadImage(`${basePath}background.png`),
    loadImage(`${basePath}ground.png`),
    loadImage(`${basePath}bird.png`),
    loadImage(`${basePath}pipe.png`),
  ]);

  assets = {
    textures: { background, ground, bird, pipe },
    sounds: {
      jump: loadAudio(`${basePath}jump.wav`),
      explosion: loadAudio(`${basePath}explosion.wav`),
      hurt: loadAudio(`${basePath}hurt.wav`),
      score: loadAudio(`${basePath}score.wav`),
      music: loadAudio(`${basePath}marios_way.mp3`, true),
    },
  };

  return assets;
}

export function getAssets(): Assets {
  if (!assets) throw new Error("Assets not loaded yet");
  return assets;
}

export function playSound(name: keyof Assets["sounds"]) {
  const s = getAssets().sounds[name];
  const clone = s.cloneNode(true) as HTMLAudioElement;
  clone.volume = s.volume;
  clone.play().catch(() => {});
}
