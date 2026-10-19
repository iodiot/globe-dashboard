import { describe, expect, it } from 'vitest';
import { computeKpis, DAY, filterQuakes, HOUR, magColor, magHistogram, sortQuakes, timeHistogram, topRegions, upToCursor } from './filters';
import type { Quake } from './types';

const NOW = 1_800_000_000_000;
const mk = (id: string, hoursAgo: number, mag: number, place: string, extra: Partial<Quake> = {}): Quake => ({
  id, time: NOW - hoursAgo * HOUR, lat: 0, lon: 0, depth: 10, mag, magType: 'ml', place,
  region: place.split(',').pop()!.trim(), sig: 0, tsunami: false, felt: 0, alert: null, url: '', ...extra,
});

const data = [
  mk('1', 1, 3.1, '10 km N of Anchorage, Alaska'),
  mk('2', 5, 5.4, 'Off the coast, Japan', { sig: 650, tsunami: true, felt: 12 }),
  mk('3', 30, 4.2, 'Central Chile, Chile'),
  mk('4', 24 * 6, 2.6, 'Hawaii region, Hawaii'),
  mk('5', 24 * 20, 6.8, 'Banda Sea, Indonesia', { sig: 900 }),
];

describe('filterQuakes', () => {
  it('applies time window', () => {
    expect(filterQuakes(data, { range: '24h', minMag: 0, query: '' }, NOW).map((q) => q.id)).toEqual(['1', '2']);
    expect(filterQuakes(data, { range: '7d', minMag: 0, query: '' }, NOW)).toHaveLength(4);
    expect(filterQuakes(data, { range: '30d', minMag: 0, query: '' }, NOW)).toHaveLength(5);
  });
  it('applies magnitude threshold (inclusive) and case-insensitive region search', () => {
    expect(filterQuakes(data, { range: '30d', minMag: 4.2, query: '' }, NOW).map((q) => q.id)).toEqual(['2', '3', '5']);
    expect(filterQuakes(data, { range: '30d', minMag: 0, query: '  jaPAN ' }, NOW).map((q) => q.id)).toEqual(['2']);
  });
});

describe('upToCursor / sortQuakes', () => {
  it('hides events after the playback cursor', () => {
    expect(upToCursor(data, null)).toBe(data);
    expect(upToCursor(data, NOW - 10 * HOUR).map((q) => q.id)).toEqual(['3', '4', '5']);
  });
  it('sorts by magnitude or time without mutating input', () => {
    expect(sortQuakes(data, 'mag').map((q) => q.id)).toEqual(['5', '2', '3', '1', '4']);
    expect(sortQuakes([...data].reverse(), 'time')[0].id).toBe('1');
    expect(data[0].id).toBe('1');
  });
});

describe('computeKpis', () => {
  it('summarises a set of events', () => {
    const k = computeKpis(data);
    expect(k.count).toBe(5);
    expect(k.strongest?.id).toBe('5');
    expect(k.meanMag).toBeCloseTo((3.1 + 5.4 + 4.2 + 2.6 + 6.8) / 5);
    expect(k).toMatchObject({ significant: 2, tsunami: 1, felt: 12 });
  });
  it('handles empty input', () => {
    expect(computeKpis([])).toMatchObject({ count: 0, strongest: null, meanMag: 0 });
  });
});

describe('histograms', () => {
  it('builds every time bucket, including empty ones', () => {
    const b = timeHistogram(data, NOW - DAY, NOW, HOUR);
    expect(b).toHaveLength(24);
    expect(b.reduce((s, x) => s + x.count, 0)).toBe(2);
    expect(b[23]).toMatchObject({ count: 1, maxMag: 3.1 }); // 1h ago → last bucket
    expect(b[19]).toMatchObject({ count: 1, maxMag: 5.4 });
  });
  it('bins magnitudes in 0.5 steps with an open-ended top bin', () => {
    const bins = magHistogram(data);
    expect(bins[0]).toEqual({ from: 2.5, count: 1 });
    expect(bins.find((x) => x.from === 3)!.count).toBe(1);
    expect(bins[bins.length - 1]).toEqual({ from: 7, count: 0 });
    expect(bins.find((x) => x.from === 6.5)!.count).toBe(1);
    expect(bins.reduce((s, x) => s + x.count, 0)).toBe(5);
  });
});

describe('topRegions / magColor', () => {
  it('ranks regions by frequency', () => {
    const r = topRegions([...data, mk('6', 2, 3, 'Somewhere, Japan')], 2);
    expect(r[0]).toEqual({ region: 'Japan', count: 2 });
    expect(r).toHaveLength(2);
  });
  it('ramps colour with magnitude', () => {
    expect(magColor(2.5)).not.toBe(magColor(7.1));
    expect(magColor(6.2)).toBe(magColor(6.9));
  });
});
