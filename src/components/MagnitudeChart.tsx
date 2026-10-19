import { useStore } from '../state/store';
import { selectMagHistogram } from '../state/selectors';
import { magColor } from '../data/filters';

export function MagnitudeChart() {
  const bins = useStore(selectMagHistogram);
  const minMag = useStore((s) => s.minMag);
  const setMinMag = useStore((s) => s.setMinMag);
  const max = Math.max(1, ...bins.map((b) => b.count));
  return (
    <section className="panel magchart" aria-labelledby="mag-h">
      <div className="panel-head"><h2 id="mag-h">Magnitude distribution</h2></div>
      <div className="bars" role="list">
        {bins.map((b, i) => {
          const last = i === bins.length - 1;
          const label = last ? `${b.from.toFixed(1)}+` : b.from.toFixed(1);
          return (
            <button
              key={b.from} role="listitem" className={`bar-col ${b.from + 0.5 <= minMag ? 'off' : ''}`}
              onClick={() => setMinMag(b.from)}
              aria-label={`M${label}: ${b.count} events. Set as minimum magnitude.`}
              title={`M${label}: ${b.count} events — click to set as minimum`}
            >
              <span className="bar-count">{b.count || ''}</span>
              <span className="bar" style={{ height: `${(b.count / max) * 100}%`, background: magColor(b.from + 0.01) }} />
              <span className="bar-label">{label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
