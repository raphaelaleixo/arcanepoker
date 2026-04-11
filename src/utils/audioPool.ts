const pools = new Map<string, HTMLAudioElement[]>();
const POOL_SIZE = 4;

function getOrCreatePool(src: string): HTMLAudioElement[] {
  let pool = pools.get(src);
  if (!pool) {
    pool = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      const a = new Audio(src);
      a.preload = "auto";
      pool.push(a);
    }
    pools.set(src, pool);
  }
  return pool;
}

export function preloadSounds(srcs: string[]): void {
  srcs.forEach(getOrCreatePool);
}

export function playPooled(
  src: string,
  volume = 0.7,
  playbackRate = 1,
): void {
  const pool = getOrCreatePool(src);
  let audio = pool.find((a) => a.paused || a.ended);
  if (!audio) {
    audio = pool[0];
  }
  audio.currentTime = 0;
  audio.volume = volume;
  audio.playbackRate = playbackRate;
  audio.play().catch(() => {});
}

export function clearPools(): void {
  pools.forEach((pool) =>
    pool.forEach((a) => {
      a.pause();
      a.src = "";
    }),
  );
  pools.clear();
}
