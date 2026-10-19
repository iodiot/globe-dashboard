import { memoLast } from '../lib/memo';
import {
  BUCKET_MS, computeKpis, filterQuakes, magHistogram, pulseWindow, sortQuakes, timeHistogram, topRegions, upToCursor, windowOf,
} from '../data/filters';
import type { Quake } from '../data/types';
import type { DashboardState } from './store';

const EMPTY: Quake[] = [];
const EMPTY_REGIONS: { region: string; count: number }[] = [];

/** "Now" for the current dataset: feed generation time. */
export const selectNow = (s: DashboardState) => s.dataset?.generated ?? 0;

const filteredMemo = memoLast((quakes: Quake[], range: DashboardState['range'], minMag: number, query: string, now: number) =>
  filterQuakes(quakes, { range, minMag, query }, now),
);
/** All events matching filters inside the time window (ignores playback cursor). */
export const selectFiltered = (s: DashboardState) =>
  s.dataset ? filteredMemo(s.dataset.quakes, s.range, s.minMag, s.query, s.dataset.generated) : EMPTY;

const visibleMemo = memoLast((filtered: Quake[], cursor: number | null) => upToCursor(filtered, cursor));
/** Filtered events that have occurred by the playback cursor. Drives globe, list, KPIs. */
export const selectVisible = (s: DashboardState) => visibleMemo(selectFiltered(s), s.cursor);

const sortedMemo = memoLast(sortQuakes);
export const selectSorted = (s: DashboardState) => sortedMemo(selectVisible(s), s.sort);

const kpiMemo = memoLast(computeKpis);
export const selectKpis = (s: DashboardState) => kpiMemo(selectVisible(s));

const histMemo = memoLast((filtered: Quake[], range: DashboardState['range'], now: number) => {
  const [start, end] = windowOf(range, now);
  return timeHistogram(filtered, start, end, BUCKET_MS[range]);
});
export const selectTimeHistogram = (s: DashboardState) => histMemo(selectFiltered(s), s.range, selectNow(s));

const magHistMemo = memoLast((q: Quake[]) => magHistogram(q));
export const selectMagHistogram = (s: DashboardState) => magHistMemo(selectVisible(s));

const regionsMemo = memoLast((quakes: Quake[], range: DashboardState['range'], now: number) =>
  topRegions(filterQuakes(quakes, { range, minMag: 0, query: '' }, now), 40),
);
export const selectRegions = (s: DashboardState) => (s.dataset ? regionsMemo(s.dataset.quakes, s.range, s.dataset.generated) : EMPTY_REGIONS);

const byIdMemo = memoLast((quakes: Quake[]) => new Map(quakes.map((q) => [q.id, q])));
export const selectById = (s: DashboardState) => byIdMemo(s.dataset?.quakes ?? EMPTY);
export const selectSelected = (s: DashboardState) => (s.selectedId ? selectById(s).get(s.selectedId) ?? null : null);

const recentMemo = memoLast((visible: Quake[], cursor: number, win: number) => visible.filter((q) => q.time > cursor - win));
/** Events inside the pulse window before the cursor. */
export const selectRecent = (s: DashboardState) =>
  recentMemo(selectVisible(s), s.cursor ?? selectNow(s), pulseWindow(s.range));
