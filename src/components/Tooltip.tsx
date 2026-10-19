import { useStore } from '../state/store';
import { selectById, selectNow } from '../state/selectors';
import { magColor } from '../data/filters';
import { fmtAgo, fmtDepth } from '../lib/format';

export function Tooltip() {
  const hover = useStore((s) => s.hover);
  const byId = useStore(selectById);
  const now = useStore(selectNow);
  const q = hover ? byId.get(hover.id) : undefined;
  if (!hover || !q) return null;
  const flip = hover.x > window.innerWidth - 280;
  return (
    <div className="tooltip" role="tooltip" style={{ left: hover.x + (flip ? -16 : 16), top: hover.y + 14, transform: flip ? 'translateX(-100%)' : undefined }}>
      <span className="tt-mag" style={{ color: magColor(q.mag) }}>M{q.mag.toFixed(1)}</span>
      <span className="tt-place">{q.place}</span>
      <span className="tt-meta">{fmtAgo(q.time, now)} · {fmtDepth(q.depth)} deep · click to inspect</span>
    </div>
  );
}
