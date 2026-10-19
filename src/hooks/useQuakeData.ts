import { useEffect } from 'react';
import { loadLatestDay, loadQuakes, mergeQuakes } from '../data/usgs';
import { useStore } from '../state/store';

const REFRESH_MS = 5 * 60_000;

/** Initial load (live, falling back to snapshot) and a cheap periodic refresh from the 24h feed. */
export function useQuakeData() {
  useEffect(() => {
    const ctrl = new AbortController();
    const { setDataset, setStatus } = useStore.getState();

    loadQuakes(ctrl.signal)
      .then(setDataset)
      .catch((err) => {
        if (!ctrl.signal.aborted) setStatus('error', String(err?.message ?? err));
      });

    const timer = window.setInterval(async () => {
      const ds = useStore.getState().dataset;
      if (!ds || document.hidden) return;
      try {
        if (ds.source === 'snapshot') {
          const live = await loadQuakes(ctrl.signal);
          if (live.source === 'live') setDataset(live);
          return;
        }
        const day = await loadLatestDay(ctrl.signal);
        setDataset({ ...ds, quakes: mergeQuakes(ds.quakes, day.quakes), generated: day.generated });
      } catch {
        /* keep current data; next tick retries */
      }
    }, REFRESH_MS);

    return () => {
      ctrl.abort();
      clearInterval(timer);
    };
  }, []);
}
