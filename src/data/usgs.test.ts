import { describe, expect, it } from 'vitest';
import { mergeQuakes, parseFeed, regionOf, type UsgsFeed } from './usgs';

const feed: UsgsFeed = {
  metadata: { generated: 1_000_000 },
  features: [
    { id: 'a', geometry: { coordinates: [142.1, 38.3, 10] }, properties: { mag: 4.56, place: '80 km E of Ishinomaki, Japan', time: 100, sig: 320, tsunami: 0, felt: 3, alert: null, magType: 'mb', type: 'earthquake' } },
    { id: 'b', geometry: { coordinates: [-150, 61, 30] }, properties: { mag: 2.9, place: 'Southern Alaska', time: 300, tsunami: 1, alert: 'green', type: 'earthquake' } },
    { id: 'nomag', geometry: { coordinates: [0, 0, 0] }, properties: { mag: null, place: 'x', time: 200 } },
    { id: 'blast', geometry: { coordinates: [0, 0, 0] }, properties: { mag: 2.6, place: 'quarry', time: 200, type: 'quarry blast' } },
    { id: 'nogeo', geometry: null, properties: { mag: 3, place: 'y', time: 200 } },
  ],
};

describe('parseFeed', () => {
  it('normalises valid earthquakes and drops invalid / non-earthquake rows', () => {
    const q = parseFeed(feed);
    expect(q.map((e) => e.id)).toEqual(['b', 'a']); // newest first
    const a = q.find((e) => e.id === 'a')!;
    expect(a).toMatchObject({ lat: 38.3, lon: 142.1, depth: 10, mag: 4.6, region: 'Japan', sig: 320, tsunami: false, felt: 3 });
    expect(a.url).toBe('https://earthquake.usgs.gov/earthquakes/eventpage/a');
    const b = q.find((e) => e.id === 'b')!;
    expect(b).toMatchObject({ tsunami: true, alert: 'green', felt: 0, sig: 0, region: 'Southern Alaska' });
  });
});

describe('regionOf', () => {
  it('takes text after the last comma, or strips a distance prefix', () => {
    expect(regionOf('17 km SSW of Jal, New Mexico')).toBe('New Mexico');
    expect(regionOf('Fiji region')).toBe('Fiji region');
    expect(regionOf('120 km NNE of Tobelo')).toBe('Tobelo');
  });
});

describe('mergeQuakes', () => {
  it('dedupes by id, prefers incoming, keeps newest first', () => {
    const [b, a] = parseFeed(feed);
    const updated = { ...a, mag: 5 };
    const fresh = { ...a, id: 'c', time: 999 };
    const merged = mergeQuakes([b, a], [updated, fresh]);
    expect(merged.map((e) => e.id)).toEqual(['c', 'b', 'a']);
    expect(merged.find((e) => e.id === 'a')!.mag).toBe(5);
  });
});
