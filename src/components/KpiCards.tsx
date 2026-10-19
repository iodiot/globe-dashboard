import { useStore } from '../state/store';
import { selectKpis } from '../state/selectors';
import { magColor, RANGE_LABEL } from '../data/filters';
import { fmtNum } from '../lib/format';

export function KpiCards() {
  const k = useStore(selectKpis);
  const range = useStore((s) => s.range);
  const select = useStore((s) => s.select);
  return (
    <div className="kpis" role="list" aria-label="Key metrics for the current filters">
      <div className="kpi" role="listitem">
        <span className="kpi-label">Events</span>
        <span className="kpi-value">{fmtNum(k.count)}</span>
        <span className="kpi-sub">{RANGE_LABEL[range]}</span>
      </div>
      <button className="kpi kpi-btn" role="listitem" disabled={!k.strongest} onClick={() => k.strongest && select(k.strongest.id)} aria-label={k.strongest ? `Strongest event M${k.strongest.mag}, ${k.strongest.place}. Select it.` : 'No events'}>
        <span className="kpi-label">Strongest</span>
        <span className="kpi-value" style={{ color: k.strongest ? magColor(k.strongest.mag) : undefined }}>
          {k.strongest ? `M${k.strongest.mag.toFixed(1)}` : '—'}
        </span>
        <span className="kpi-sub" title={k.strongest?.place}>{k.strongest?.region ?? '—'}</span>
      </button>
      <div className="kpi" role="listitem">
        <span className="kpi-label">Mean magnitude</span>
        <span className="kpi-value">{k.count ? k.meanMag.toFixed(2) : '—'}</span>
        <span className="kpi-sub">across visible events</span>
      </div>
      <div className="kpi" role="listitem">
        <span className="kpi-label">Significant</span>
        <span className="kpi-value">{fmtNum(k.significant)}</span>
        <span className="kpi-sub">{k.tsunami} tsunami flag{k.tsunami === 1 ? '' : 's'} · {fmtNum(k.felt)} felt reports</span>
      </div>
    </div>
  );
}
