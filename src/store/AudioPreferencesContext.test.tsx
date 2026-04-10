import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { AudioPreferencesProvider, useAudioPreferences } from "./AudioPreferencesContext";

const wrapper = ({ children }: { children: ReactNode }) => (
  <AudioPreferencesProvider>{children}</AudioPreferencesProvider>
);

describe("AudioPreferencesContext", () => {
  it("defaults both flags to true", () => {
    const { result } = renderHook(() => useAudioPreferences(), { wrapper });
    expect(result.current.musicEnabled).toBe(true);
    expect(result.current.sfxEnabled).toBe(true);
  });

  it("toggleMusic flips musicEnabled", () => {
    const { result } = renderHook(() => useAudioPreferences(), { wrapper });
    act(() => result.current.toggleMusic());
    expect(result.current.musicEnabled).toBe(false);
    act(() => result.current.toggleMusic());
    expect(result.current.musicEnabled).toBe(true);
  });

  it("toggleSfx flips sfxEnabled", () => {
    const { result } = renderHook(() => useAudioPreferences(), { wrapper });
    act(() => result.current.toggleSfx());
    expect(result.current.sfxEnabled).toBe(false);
    act(() => result.current.toggleSfx());
    expect(result.current.sfxEnabled).toBe(true);
  });

  it("throws when used outside provider", () => {
    expect(() =>
      renderHook(() => useAudioPreferences())
    ).toThrow("useAudioPreferences must be used inside <AudioPreferencesProvider>");
  });
});
