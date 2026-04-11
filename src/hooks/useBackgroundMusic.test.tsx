import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { SettingsProvider } from "../store/SettingsContext";
import { useBackgroundMusic } from "./useBackgroundMusic";

// jsdom doesn't implement HTMLMediaElement — stub play/pause
let playMock: ReturnType<typeof vi.fn>;
let pauseMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  playMock = vi.fn().mockResolvedValue(undefined);
  pauseMock = vi.fn();
  window.HTMLMediaElement.prototype.play = playMock as unknown as () => Promise<void>;
  window.HTMLMediaElement.prototype.pause = pauseMock as unknown as () => void;
});

afterEach(() => {
  vi.clearAllMocks();
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <SettingsProvider>{children}</SettingsProvider>
);

describe("useBackgroundMusic", () => {
  it("calls play when musicEnabled is true (default)", () => {
    renderHook(() => useBackgroundMusic("/audio/game-loop-compressed.mp3"), { wrapper });
    expect(playMock).toHaveBeenCalled();
  });
});
