import { describe, it, expect, vi, beforeEach } from "vitest";
import { playPooled, preloadSounds, clearPools } from "./audioPool";

function makeMockAudio(): HTMLAudioElement {
  return {
    preload: "",
    currentTime: 0,
    volume: 1,
    playbackRate: 1,
    paused: true,
    ended: false,
    src: "",
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
  } as unknown as HTMLAudioElement;
}

let audioInstances: HTMLAudioElement[];

beforeEach(() => {
  audioInstances = [];
  clearPools();
  vi.stubGlobal(
    "Audio",
    vi.fn(function (this: HTMLAudioElement) {
      const mock = makeMockAudio();
      audioInstances.push(mock);
      return mock;
    }),
  );
});

describe("audioPool", () => {
  it("preloadSounds creates pool entries eagerly", () => {
    preloadSounds(["/audio/a.mp3", "/audio/b.mp3"]);
    // 4 per sound × 2 sounds = 8
    expect(audioInstances).toHaveLength(8);
    expect(audioInstances[0].preload).toBe("auto");
  });

  it("playPooled reuses an idle audio element", () => {
    playPooled("/audio/test.mp3", 0.5, 1.2);
    expect(audioInstances).toHaveLength(4); // pool created
    const first = audioInstances[0];
    expect(first.play).toHaveBeenCalledTimes(1);
    expect(first.volume).toBe(0.5);
    expect(first.playbackRate).toBe(1.2);
    expect(first.currentTime).toBe(0);

    // Play again — should reuse same element (it's paused)
    playPooled("/audio/test.mp3", 0.3);
    expect(first.play).toHaveBeenCalledTimes(2);
    expect(first.volume).toBe(0.3);
  });

  it("playPooled picks a different element when first is busy", () => {
    playPooled("/audio/test.mp3");
    const first = audioInstances[0];
    // Simulate first element still playing
    (first as any).paused = false;
    (first as any).ended = false;

    playPooled("/audio/test.mp3");
    // Should pick second element since first is busy
    const second = audioInstances[1];
    expect(second.play).toHaveBeenCalledTimes(1);
  });

  it("playPooled reuses first element when all are busy", () => {
    // Fill all 4 pool slots
    for (let i = 0; i < 4; i++) {
      playPooled("/audio/test.mp3");
      (audioInstances[i] as any).paused = false;
      (audioInstances[i] as any).ended = false;
    }

    // 5th play should wrap around to first
    playPooled("/audio/test.mp3");
    expect(audioInstances[0].play).toHaveBeenCalledTimes(2);
  });

  it("clearPools pauses and empties all pools", () => {
    preloadSounds(["/audio/a.mp3"]);
    expect(audioInstances).toHaveLength(4);

    clearPools();

    audioInstances.forEach((a) => {
      expect(a.pause).toHaveBeenCalled();
      expect(a.src).toBe("");
    });

    // New play should create a fresh pool
    const prevCount = audioInstances.length;
    playPooled("/audio/a.mp3");
    expect(audioInstances.length).toBe(prevCount + 4);
  });
});
