import { useEffect, useState } from 'react';
import { useStore } from '../state/store';
import { selectRegions } from '../state/selectors';
import { MAX_MAG, MIN_MAG, RANGE_LABEL } from '../data/filters';
import type { TimeRange } from '../data/types';

const RANGES: TimeRange[] = ['24h', '7d', '30d'];

export function FiltersPanel() {
  const range = useStore((s) => s.range);
  const minMag = useStore((s) => s.minMag);
  const query = useStore((s) => s.query);
  const { setRange, setMinMag, setQuery, resetFilters } = useStore.getState();
  const regions = useStore(selectRegions);

  // Debounce typing → store, keep input responsive.
  const [text, setText] = useState(query);
  const [syncedQuery, setSyncedQuery] = useState(query);
  if (query !== syncedQuery) {
    // Store changed from elsewhere (chip, reset, URL): adopt it during render.
    setSyncedQuery(query);
    setText(query);
  }
  useEffect(() => {
    const id = setTimeout(() => text !== useStore.getState().query && setQuery(text), 180);
    return () => clearTimeout(id);
  }, [text, setQuery]);

  const dirty = range !== '7d' || minMag !== 2.5 || query !== '';

  return (
    <section className="panel filters" aria-labelledby="filters-h">
      <div className="panel-head">
        <h2 id="filters-h">Filters</h2>
        <button className="link-btn" onClick={resetFilters} disabled={!dirty}>Reset</button>
      </div>

      <div className="segmented" role="radiogroup" aria-label="Time range">
        {RANGES.map((r) => (
          <button key={r} role="radio" aria-checked={range === r} title={RANGE_LABEL[r]} className={range === r ? 'on' : ''} onClick={() => setRange(r)}>
            {r}
          </button>
        ))}
      </div>

      <label className="field">
        <span className="field-label">
          Min magnitude <output>M{minMag.toFixed(1)}+</output>
        </span>
        <input
          type="range" min={MIN_MAG} max={MAX_MAG - 0.5} step={0.1} value={minMag}
          onChange={(e) => setMinMag(Number(e.target.value))}
          aria-valuetext={`Magnitude ${minMag.toFixed(1)} and above`}
          style={{ ['--fill' as string]: `${((minMag - MIN_MAG) / (MAX_MAG - 0.5 - MIN_MAG)) * 100}%` }}
        />
      </label>

      <label className="field">
        <span className="field-label">Region search <kbd>/</kbd></span>
        <div className="search">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          <input id="region-search" type="search" placeholder="Japan, Alaska, Chile…" value={text} onChange={(e) => setText(e.target.value)} list="region-list" autoComplete="off" />
        </div>
        <datalist id="region-list">
          {regions.map((r) => <option key={r.region} value={r.region} />)}
        </datalist>
      </label>
      <div className="chips" aria-label="Most active regions">
        {regions.slice(0, 6).map((r) => (
          <button key={r.region} className={`chip ${query === r.region ? 'on' : ''}`} onClick={() => setQuery(query === r.region ? '' : r.region)} aria-pressed={query === r.region}>
            {r.region} <span>{r.count}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
