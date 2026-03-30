import { describe, it, expect } from 'vitest';
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
});
