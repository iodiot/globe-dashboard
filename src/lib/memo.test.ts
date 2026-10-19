import { describe, expect, it, vi } from 'vitest';
import { memoLast } from './memo';

describe('memoLast', () => {
  it('recomputes only when an argument identity changes', () => {
    const fn = vi.fn((a: number[], k: string) => a.map((x) => x + k));
    const m = memoLast(fn);
    const arr = [1, 2];
    const r1 = m(arr, 'x');
    expect(m(arr, 'x')).toBe(r1);
    expect(fn).toHaveBeenCalledTimes(1);
    m([1, 2], 'x');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
