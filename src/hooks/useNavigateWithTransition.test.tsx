import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useNavigateWithTransition } from './useNavigateWithTransition';

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{children}</MemoryRouter>;
}

describe('useNavigateWithTransition', () => {
  afterEach(() => {
    // Clean up any stubbed startViewTransition
    Object.defineProperty(document, 'startViewTransition', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  it('returns a function', () => {
    const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });
    expect(typeof result.current).toBe('function');
  });

  it('calls navigate directly when startViewTransition is not available', () => {
    // jsdom does not implement startViewTransition, so this always exercises the fallback path
    const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });
    // calling it must not throw
    expect(() => {
      act(() => {
        result.current('/game');
      });
    }).not.toThrow();
  });

  it('calls startViewTransition when available', () => {
    const mockStartViewTransition = vi.fn((cb: () => void) => {
      cb();
    });
    Object.defineProperty(document, 'startViewTransition', {
      value: mockStartViewTransition,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });
    act(() => {
      result.current('/game');
    });

    expect(mockStartViewTransition).toHaveBeenCalledOnce();
    // Verify that startViewTransition was called with a function (the navigate callback)
    expect(mockStartViewTransition).toHaveBeenCalledWith(expect.any(Function));
  });
});
