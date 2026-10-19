/** A single earthquake event, normalised from the USGS GeoJSON feed. */
export interface Quake {
  id: string;
  /** Epoch milliseconds (UTC). */
  time: number;
  lat: number;
  lon: number;
  /** Hypocentre depth in km. */
  depth: number;
  mag: number;
  magType: string;
  place: string;
  /** Coarse region derived from `place` (text after the last comma). */
  region: string;
  /** USGS significance score, 0..1000+. */
  sig: number;
  tsunami: boolean;
  felt: number;
  alert: 'green' | 'yellow' | 'orange' | 'red' | null;
  url: string;
}

export type DataSource = 'live' | 'snapshot';

export interface QuakeDataset {
  quakes: Quake[];
  /** Time the feed was generated (epoch ms). Acts as "now" for time windows. */
  generated: number;
  source: DataSource;
}

export type TimeRange = '24h' | '7d' | '30d';
export type SortKey = 'time' | 'mag';

export interface Filters {
  range: TimeRange;
  minMag: number;
  query: string;
}
