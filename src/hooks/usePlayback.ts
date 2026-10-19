import { useEffect } from 'react';
import { RANGE_MS, windowOf } from '../data/filters';
import { useStore } from '../state/store';

const DURATION_MS = 20_000; // full window plays in 20 s

/** Advances the timeline cursor while playing. */
export function usePlayback() {
  const playing = useStore((s) => s.playing);
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      const s = useStore.getState();
      const ds = s.dataset;
      if (!ds) return;
      const [start, end] = windowOf(s.range, ds.generated);
      const step = ((now - prev) / DURATION_MS) * RANGE_MS[s.range];
      prev = now;
      const cur = s.cursor == null || s.cursor >= end ? start : s.cursor;
      const next = cur + step;
      if (next >= end) {
        s.setCursor(null);
        s.setPlaying(false);
        return;
      }
      s.setCursor(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
}
