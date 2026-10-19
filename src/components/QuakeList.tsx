import { memo, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useStore } from '../state/store';
import { selectNow, selectSorted } from '../state/selectors';
import { magColor } from '../data/filters';
import { fmtAgo, fmtDepth } from '../lib/format';
import type { Quake } from '../data/types';

const ROW = 58;

const Row = memo(function Row({ q, selected, now, onSelect }: { q: Quake; selected: boolean; now: number; onSelect: (id: string) => void }) {
  return (
    <div
      id={`q-${q.id}`}
      role="option"
      aria-selected={selected}
      className={`row ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(q.id)}
      onMouseEnter={() => useStore.getState().setHover(null)}
    >
      <span className="mag" style={{ ['--c' as string]: magColor(q.mag) }}>{q.mag.toFixed(1)}</span>
      <span className="row-main">
        <span className="place">{q.place}</span>
        <span className="meta">
          {fmtAgo(q.time, now)} · {fmtDepth(q.depth)} deep{q.tsunami ? ' · ' : ''}
          {q.tsunami && <b className="tsunami">tsunami flag</b>}
        </span>
      </span>
    </div>
  );
});

export function QuakeList() {
  const list = useStore(selectSorted);
  const now = useStore(selectNow);
  const selectedId = useStore((s) => s.selectedId);
  const sort = useStore((s) => s.sort);
  const status = useStore((s) => s.status);
  const { select, setSort } = useStore.getState();
  const parent = useRef<HTMLDivElement>(null);

  const v = useVirtualizer({ count: list.length, getScrollElement: () => parent.current, estimateSize: () => ROW, overscan: 8 });
  const selIndex = selectedId ? list.findIndex((q) => q.id === selectedId) : -1;

  useEffect(() => {
    if (selIndex >= 0) v.scrollToIndex(selIndex, { align: 'auto' });
  }, [selIndex, v]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!list.length) return;
    let i = selIndex;
    if (e.key === 'ArrowDown') i = Math.min(list.length - 1, i + 1);
    else if (e.key === 'ArrowUp') i = Math.max(0, i - 1);
    else if (e.key === 'Home') i = 0;
    else if (e.key === 'End') i = list.length - 1;
    else if (e.key === 'PageDown') i = Math.min(list.length - 1, i + 8);
    else if (e.key === 'PageUp') i = Math.max(0, i - 8);
    else return;
    e.preventDefault();
    select(list[i].id);
  };

  return (
    <section className="panel list-panel" aria-labelledby="list-h">
      <div className="panel-head">
        <h2 id="list-h">Events <span className="count">{list.length.toLocaleString()}</span></h2>
        <div className="segmented small" role="radiogroup" aria-label="Sort events by">
          <button role="radio" aria-checked={sort === 'time'} className={sort === 'time' ? 'on' : ''} onClick={() => setSort('time')}>Latest</button>
          <button role="radio" aria-checked={sort === 'mag'} className={sort === 'mag' ? 'on' : ''} onClick={() => setSort('mag')}>Strongest</button>
        </div>
      </div>
      <div
        ref={parent}
        className="list"
        role="listbox"
        tabIndex={0}
        aria-label="Earthquake events. Use arrow keys to select."
        aria-activedescendant={selIndex >= 0 ? `q-${selectedId}` : undefined}
        onKeyDown={onKeyDown}
      >
        {status === 'loading' && Array.from({ length: 8 }, (_, i) => <div key={i} className="row skeleton" />)}
        {status === 'ready' && list.length === 0 && <p className="empty">No events match these filters.</p>}
        <div style={{ height: v.getTotalSize(), position: 'relative' }}>
          {v.getVirtualItems().map((it) => (
            <div key={list[it.index].id} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ROW, transform: `translateY(${it.start}px)` }}>
              <Row q={list[it.index]} selected={list[it.index].id === selectedId} now={now} onSelect={select} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
