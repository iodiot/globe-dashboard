import { useRef } from 'react';
import { useStore } from '../state/store';
import { selectNow, selectTimeHistogram } from '../state/selectors';
import { RANGE_MS, windowOf, magColor } from '../data/filters';
import { fmtDateTime, fmtDay, fmtTime } from '../lib/format';
import { useElementWidth } from '../hooks/useElementWidth';

const H = 112;
const PAD = { l: 30, r: 8, t: 10, b: 20 };

export function TimelinePanel() {
  const buckets = useStore(selectTimeHistogram);
  const now = useStore(selectNow);
  const range = useStore((s) => s.range);
  const cursor = useStore((s) => s.cursor);
  const playing = useStore((s) => s.playing);
  const { setCursor, setPlaying } = useStore.getState();
  const [wrapRef, width] = useElementWidth<HTMLDivElement>();
  const dragging = useRef(false);

  const [start, end] = windowOf(range, now);
  const cur = cursor ?? end;
  const w = Math.max(0, width - PAD.l - PAD.r);
  const h = H - PAD.t - PAD.b;
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const x = (t: number) => PAD.l + ((t - start) / (end - start)) * w;
  const y = (c: number) => PAD.t + h - (c / max) * h;
  const bw = buckets.length ? Math.max(1, w / buckets.length - 2) : 0;
  const fmtTick = RANGE_MS[range] <= 86_400_000 ? fmtTime : fmtDay;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => start + f * (end - start));

  const fromPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - rect.left - PAD.l) / w));
    setCursor(f >= 0.999 ? null : start + f * (end - start));
  };

  return (
    <section className="panel timeline" aria-labelledby="timeline-h">
      <div className="panel-head">
        <h2 id="timeline-h">Timeline</h2>
        <div className="timeline-ctrl">
          <span className="cursor-label" aria-live="polite">{cursor == null ? 'Now' : fmtDateTime(cur)}</span>
          <button className="btn" onClick={() => setPlaying(!playing)} aria-pressed={playing} title="Play / pause (Space)">
            {playing ? (
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor" /></svg>
            )}
            {playing ? 'Pause' : 'Play'}
          </button>
          <button className="btn ghost" onClick={() => { setPlaying(false); setCursor(null); }} disabled={cursor == null}>Live</button>
        </div>
      </div>
      <div ref={wrapRef} className="chart-wrap">
        {width > 0 && (
          <svg
            width={width} height={H} className="chart"
            onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); setPlaying(false); fromPointer(e); }}
            onPointerMove={(e) => dragging.current && fromPointer(e)}
            onPointerUp={() => (dragging.current = false)}
            aria-hidden="true"
          >
            {[0.5, 1].map((f) => (
              <g key={f}>
                <line x1={PAD.l} x2={PAD.l + w} y1={y(max * f)} y2={y(max * f)} className="grid" />
                <text x={PAD.l - 6} y={y(max * f) + 4} className="axis" textAnchor="end">{Math.round(max * f)}</text>
              </g>
            ))}
            {buckets.map((b) => (
              <rect
                key={b.start} x={x(b.start) + 1} y={y(b.count)} width={bw} height={Math.max(0, PAD.t + h - y(b.count))} rx={2}
                fill={b.count ? magColor(b.maxMag) : 'transparent'}
                opacity={b.start > cur ? 0.18 : 0.85}
              >
                <title>{`${fmtDateTime(b.start)}: ${b.count} events, max M${b.maxMag.toFixed(1)}`}</title>
              </rect>
            ))}
            <line x1={PAD.l} x2={PAD.l + w} y1={PAD.t + h} y2={PAD.t + h} className="baseline" />
            {ticks.map((t, i) => (
              <text key={t} x={x(t)} y={H - 4} className="axis" textAnchor={i === 0 ? 'start' : i === ticks.length - 1 ? 'end' : 'middle'}>
                {i === ticks.length - 1 ? 'now' : fmtTick(t)}
              </text>
            ))}
            <line x1={x(cur)} x2={x(cur)} y1={PAD.t - 4} y2={PAD.t + h} className="cursor" />
            <circle cx={x(cur)} cy={PAD.t - 4} r={4} className="cursor-dot" />
          </svg>
        )}
      </div>
      <input
        className="scrubber" type="range" min={start} max={end} step={(end - start) / 500} value={cur}
        onChange={(e) => { setPlaying(false); const v = Number(e.target.value); setCursor(v >= end - (end - start) / 1000 ? null : v); }}
        aria-label="Timeline position"
        aria-valuetext={cursor == null ? 'Now' : fmtDateTime(cur)}
      />
    </section>
  );
}
