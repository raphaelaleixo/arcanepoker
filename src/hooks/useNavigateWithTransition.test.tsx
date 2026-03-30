import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useNavigateWithTransition } from './useNavigateWithTransition';

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe('useNavigateWithTransition', () => {
  it('returns a function', () => {
    const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });
    expect(typeof result.current).toBe('function');
  });

  it('calls navigate directly when startViewTransition is not available', () => {
    // jsdom does not implement startViewTransition, so this always exercises the fallback path
    const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });
    // calling it must not throw
    expect(() => result.current('/game')).not.toThrow();
  });

  afterEach(() => {
    // Clean up any stubbed startViewTransition
    Object.defineProperty(document, 'startViewTransition', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  it('calls startViewTransition when available', () => {
    const mockStartViewTransition = vi.fn((cb: () => void) => cb());
    Object.defineProperty(document, 'startViewTransition', {
      value: mockStartViewTransition,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });
    result.current('/game');

    expect(mockStartViewTransition).toHaveBeenCalledOnce();
  });
});
