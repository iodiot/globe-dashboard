import { describe, expect, it } from 'vitest';
import { DEFAULT_URL_STATE, parseUrlState, toQueryString } from './urlState';

describe('url state', () => {
  it('omits defaults', () => {
    expect(toQueryString(DEFAULT_URL_STATE)).toBe('');
  });
  it('round-trips filters and selection', () => {
    const s = { range: '30d' as const, minMag: 4.5, query: 'Japan', selectedId: 'us7000abcd', sort: 'mag' as const };
    const qs = toQueryString(s);
    expect(qs).toBe('?range=30d&mag=4.5&q=Japan&sel=us7000abcd&sort=mag');
    expect(parseUrlState(qs)).toEqual(s);
  });
  it('rejects invalid values and clamps magnitude', () => {
    expect(parseUrlState('?range=1y&mag=abc&sort=nope')).toEqual(DEFAULT_URL_STATE);
    expect(parseUrlState('?mag=12').minMag).toBe(8);
    expect(parseUrlState('?mag=1').minMag).toBe(2.5);
  });
});
