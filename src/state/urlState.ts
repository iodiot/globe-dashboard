import type { Filters, SortKey, TimeRange } from '../data/types';
import { MAX_MAG, MIN_MAG } from '../data/filters';

export interface UrlState extends Filters {
  selectedId: string | null;
  sort: SortKey;
}

export const DEFAULT_URL_STATE: UrlState = { range: '7d', minMag: 2.5, query: '', selectedId: null, sort: 'time' };

const RANGES: TimeRange[] = ['24h', '7d', '30d'];

/** Parse (and validate) shareable state from a query string. Unknown/invalid values fall back to defaults. */
export function parseUrlState(search: string): UrlState {
  const p = new URLSearchParams(search);
  const range = p.get('range') as TimeRange | null;
  const mag = Number.parseFloat(p.get('mag') ?? '');
  const sort = p.get('sort');
  return {
    range: range && RANGES.includes(range) ? range : DEFAULT_URL_STATE.range,
    minMag: Number.isFinite(mag) ? Math.min(MAX_MAG, Math.max(MIN_MAG, Math.round(mag * 10) / 10)) : DEFAULT_URL_STATE.minMag,
    query: (p.get('q') ?? '').slice(0, 80),
    selectedId: p.get('sel') || null,
    sort: sort === 'mag' ? 'mag' : 'time',
  };
}

/** Serialise state, omitting defaults so links stay short. */
export function toQueryString(s: UrlState): string {
  const p = new URLSearchParams();
  if (s.range !== DEFAULT_URL_STATE.range) p.set('range', s.range);
  if (s.minMag !== DEFAULT_URL_STATE.minMag) p.set('mag', s.minMag.toFixed(1));
  if (s.query.trim()) p.set('q', s.query.trim());
  if (s.selectedId) p.set('sel', s.selectedId);
  if (s.sort !== DEFAULT_URL_STATE.sort) p.set('sort', s.sort);
  const str = p.toString();
  return str ? `?${str}` : '';
}
