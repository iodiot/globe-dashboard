import type { Filters, Quake, SortKey, TimeRange } from './types';

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;

export const RANGE_MS: Record<TimeRange, number> = { '24h': DAY, '7d': 7 * DAY, '30d': 30 * DAY };
export const RANGE_LABEL: Record<TimeRange, string> = { '24h': 'Past 24 hours', '7d': 'Past 7 days', '30d': 'Past 30 days' };
/** Histogram bucket size per range. */
export const BUCKET_MS: Record<TimeRange, number> = { '24h': HOUR, '7d': 6 * HOUR, '30d': DAY };

export const MIN_MAG = 2.5;
export const MAX_MAG = 8;

export function windowOf(range: TimeRange, now: number): [number, number] {
  return [now - RANGE_MS[range], now];
}

/** Apply time window, magnitude threshold and free-text region search. Input order is preserved. */
export function filterQuakes(quakes: readonly Quake[], f: Filters, now: number): Quake[] {
  const [start, end] = windowOf(f.range, now);
  const q = f.query.trim().toLowerCase();
  return quakes.filter(
    (e) => e.time >= start && e.time <= end && e.mag >= f.minMag && (!q || e.place.toLowerCase().includes(q)),
  );
}

/** Events that have "happened" by the playback cursor. */
export function upToCursor(quakes: readonly Quake[], cursor: number | null): Quake[] {
  return cursor == null ? (quakes as Quake[]) : quakes.filter((q) => q.time <= cursor);
}

export function sortQuakes(quakes: readonly Quake[], key: SortKey): Quake[] {
  const s = [...quakes];
  return key === 'mag' ? s.sort((a, b) => b.mag - a.mag || b.time - a.time) : s.sort((a, b) => b.time - a.time);
}

export interface Kpis {
  count: number;
  strongest: Quake | null;
  meanMag: number;
  significant: number;
  tsunami: number;
  felt: number;
}

export function computeKpis(quakes: readonly Quake[]): Kpis {
  let strongest: Quake | null = null;
  let sum = 0, significant = 0, tsunami = 0, felt = 0;
  for (const q of quakes) {
    if (!strongest || q.mag > strongest.mag) strongest = q;
    sum += q.mag;
    if (q.sig >= 600) significant++;
    if (q.tsunami) tsunami++;
    felt += q.felt;
  }
  return { count: quakes.length, strongest, meanMag: quakes.length ? sum / quakes.length : 0, significant, tsunami, felt };
}

export interface Bucket { start: number; end: number; count: number; maxMag: number }

/** Fixed-width time buckets covering [start, end). Every bucket is present, even if empty. */
export function timeHistogram(quakes: readonly Quake[], start: number, end: number, size: number): Bucket[] {
  const n = Math.max(1, Math.ceil((end - start) / size));
  const buckets: Bucket[] = Array.from({ length: n }, (_, i) => ({ start: start + i * size, end: start + (i + 1) * size, count: 0, maxMag: 0 }));
  for (const q of quakes) {
    if (q.time < start || q.time > end) continue;
    const i = Math.min(n - 1, Math.floor((q.time - start) / size));
    buckets[i].count++;
    buckets[i].maxMag = Math.max(buckets[i].maxMag, q.mag);
  }
  return buckets;
}

/** Magnitude distribution in 0.5 steps from MIN_MAG; the last bin is open-ended. */
export function magHistogram(quakes: readonly Quake[], step = 0.5, from = MIN_MAG, to = 7): { from: number; count: number }[] {
  const n = Math.round((to - from) / step) + 1;
  const bins = Array.from({ length: n }, (_, i) => ({ from: from + i * step, count: 0 }));
  for (const q of quakes) {
    const i = Math.min(n - 1, Math.max(0, Math.floor((q.mag - from + 1e-9) / step)));
    bins[i].count++;
  }
  return bins;
}

/** Most frequent regions, for search suggestions. */
export function topRegions(quakes: readonly Quake[], limit = 8): { region: string; count: number }[] {
  const m = new Map<string, number>();
  for (const q of quakes) m.set(q.region, (m.get(q.region) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([region, count]) => ({ region, count }));
}

/** Magnitude → colour (hex) on a perceptual yellow → red → magenta ramp. */
export function magColor(mag: number): string {
  if (mag >= 7) return '#ff2bd6';
  if (mag >= 6) return '#ff2d55';
  if (mag >= 5) return '#ff6a2b';
  if (mag >= 4) return '#ffa62b';
  if (mag >= 3) return '#ffd84d';
  return '#c9f26b';
}

export const MAG_LEGEND = [
  { label: '<3', color: magColor(2.5) },
  { label: '3+', color: magColor(3) },
  { label: '4+', color: magColor(4) },
  { label: '5+', color: magColor(5) },
  { label: '6+', color: magColor(6) },
  { label: '7+', color: magColor(7) },
];

/** Marker radius in globe units (globe radius = 1). */
export function magRadius(mag: number): number {
  return 0.005 + Math.max(0, mag - 2) ** 1.6 * 0.0028;
}

/** Window in which an event counts as "recent" relative to the cursor (and pulses). */
export function pulseWindow(range: TimeRange): number {
  return Math.min(6 * HOUR, RANGE_MS[range] / 8);
}
