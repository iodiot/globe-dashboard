import type { Quake, QuakeDataset } from './types';

const BASE = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary';
/** M2.5+ events for the past 30 days (~2k events, CORS enabled, no API key). */
export const MONTH_FEED = `${BASE}/2.5_month.geojson`;
/** Small feed used for cheap periodic refreshes. */
export const DAY_FEED = `${BASE}/2.5_day.geojson`;

interface UsgsFeature {
  id: string;
  geometry: { coordinates: [number, number, number?] } | null;
  properties: {
    mag: number | null;
    place: string | null;
    time: number;
    sig?: number | null;
    tsunami?: number | null;
    felt?: number | null;
    alert?: string | null;
    magType?: string | null;
    type?: string | null;
  };
}

export interface UsgsFeed {
  metadata?: { generated?: number };
  generated?: number;
  features: UsgsFeature[];
}

const ALERTS = new Set(['green', 'yellow', 'orange', 'red']);

export function regionOf(place: string): string {
  const i = place.lastIndexOf(',');
  const r = (i >= 0 ? place.slice(i + 1) : place).trim();
  // "50 km S of Foo" without a comma: strip the distance prefix.
  return r.replace(/^\d+\s*km\s+[NSEW]{1,3}\s+of\s+/i, '') || 'Unknown';
}

/** Normalise a USGS GeoJSON feed into typed Quake records. Invalid rows are dropped. */
export function parseFeed(feed: UsgsFeed): Quake[] {
  const out: Quake[] = [];
  for (const f of feed.features ?? []) {
    const p = f.properties;
    const c = f.geometry?.coordinates;
    if (!c || p?.mag == null || !Number.isFinite(p.mag) || !Number.isFinite(p.time)) continue;
    if (p.type && p.type !== 'earthquake') continue;
    const place = p.place?.trim() || 'Unknown location';
    out.push({
      id: f.id,
      time: p.time,
      lon: c[0],
      lat: c[1],
      depth: c[2] ?? 0,
      mag: Math.round(p.mag * 10) / 10,
      magType: p.magType ?? '',
      place,
      region: regionOf(place),
      sig: p.sig ?? 0,
      tsunami: p.tsunami === 1,
      felt: p.felt ?? 0,
      alert: p.alert && ALERTS.has(p.alert) ? (p.alert as Quake['alert']) : null,
      url: `https://earthquake.usgs.gov/earthquakes/eventpage/${f.id}`,
    });
  }
  return out.sort((a, b) => b.time - a.time);
}

/** Merge newer records into an existing list (by id), newest first. */
export function mergeQuakes(base: Quake[], incoming: Quake[]): Quake[] {
  const map = new Map(base.map((q) => [q.id, q]));
  for (const q of incoming) map.set(q.id, q);
  return [...map.values()].sort((a, b) => b.time - a.time);
}

async function getJson(url: string, signal?: AbortSignal): Promise<UsgsFeed> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

/**
 * Load the live 30-day feed. If the network or USGS is unavailable,
 * fall back to the snapshot bundled with the app (clearly flagged as such).
 */
export async function loadQuakes(signal?: AbortSignal): Promise<QuakeDataset> {
  try {
    const feed = await getJson(MONTH_FEED, signal);
    return { quakes: parseFeed(feed), generated: feed.metadata?.generated ?? Date.now(), source: 'live' };
  } catch (err) {
    if (signal?.aborted) throw err;
    console.warn('[globe-dashboard] live feed failed, using bundled snapshot', err);
    const feed = await getJson(`${import.meta.env.BASE_URL}snapshot.json`, signal);
    return { quakes: parseFeed(feed), generated: feed.generated ?? feed.metadata?.generated ?? Date.now(), source: 'snapshot' };
  }
}

export async function loadLatestDay(signal?: AbortSignal): Promise<{ quakes: Quake[]; generated: number }> {
  const feed = await getJson(DAY_FEED, signal);
  return { quakes: parseFeed(feed), generated: feed.metadata?.generated ?? Date.now() };
}
