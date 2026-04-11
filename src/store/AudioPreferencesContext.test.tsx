import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { SettingsProvider, useSettings } from "./SettingsContext";

const wrapper = ({ children }: { children: ReactNode }) => (
  <SettingsProvider>{children}</SettingsProvider>
);

describe("SettingsContext (audio preferences)", () => {
  it("defaults both flags to true", () => {
    const { result } = renderHook(() => useSettings(), { wrapper });
    expect(result.current.musicEnabled).toBe(true);
    expect(result.current.sfxEnabled).toBe(true);
  });

  it("toggleMusic flips musicEnabled", () => {
    const { result } = renderHook(() => useSettings(), { wrapper });
    act(() => result.current.toggleMusic());
    expect(result.current.musicEnabled).toBe(false);
    act(() => result.current.toggleMusic());
    expect(result.current.musicEnabled).toBe(true);
  });

  it("toggleSfx flips sfxEnabled", () => {
    const { result } = renderHook(() => useSettings(), { wrapper });
    act(() => result.current.toggleSfx());
    expect(result.current.sfxEnabled).toBe(false);
    act(() => result.current.toggleSfx());
    expect(result.current.sfxEnabled).toBe(true);
  });

  it("throws when used outside provider", () => {
    // Suppress React's console.error for this expected throw
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      renderHook(() => useSettings())
    ).toThrow("useSettings must be used inside <SettingsProvider>");
    spy.mockRestore();
  });
});
