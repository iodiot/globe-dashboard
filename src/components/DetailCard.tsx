import { useStore } from '../state/store';
import { selectNow, selectSelected } from '../state/selectors';
import { magColor } from '../data/filters';
import { fmtAgo, fmtDateTime, fmtDepth, fmtLatLon, fmtNum } from '../lib/format';

export function DetailCard() {
  const q = useStore(selectSelected);
  const now = useStore(selectNow);
  const { select } = useStore.getState();
  if (!q) return null;
  return (
    <aside className="detail" aria-labelledby="detail-h" aria-live="polite">
      <div className="detail-top">
        <span className="detail-mag" style={{ ['--c' as string]: magColor(q.mag) }}>
          <small>M</small>{q.mag.toFixed(1)}
        </span>
        <div>
          <h2 id="detail-h">{q.place}</h2>
          <p className="muted">{fmtDateTime(q.time)} · {fmtAgo(q.time, now)}</p>
        </div>
        <button className="icon-btn close" onClick={() => select(null)} aria-label="Close details (Esc)">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      </div>
      <dl className="detail-grid">
        <div><dt>Depth</dt><dd>{fmtDepth(q.depth)}</dd></div>
        <div><dt>Location</dt><dd>{fmtLatLon(q.lat, q.lon)}</dd></div>
        <div><dt>Significance</dt><dd>{q.sig}</dd></div>
        <div><dt>Felt reports</dt><dd>{fmtNum(q.felt)}</dd></div>
        <div><dt>Mag type</dt><dd>{q.magType || '—'}</dd></div>
        <div><dt>Alerts</dt><dd>{q.alert ? <span className={`alert ${q.alert}`}>PAGER {q.alert}</span> : q.tsunami ? <span className="alert yellow">Tsunami flag</span> : 'None'}</dd></div>
      </dl>
      <div className="detail-actions">
        <button className="btn" onClick={() => useStore.setState((s) => ({ flyNonce: s.flyNonce + 1 }))}>Fly to</button>
        <a className="btn ghost" href={q.url} target="_blank" rel="noopener noreferrer">USGS event page ↗</a>
      </div>
    </aside>
  );
}
