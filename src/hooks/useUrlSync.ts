import { useEffect } from 'react';
import { useStore } from '../state/store';
import { toQueryString } from '../state/urlState';

/** Mirror filters + selection into the query string (replaceState, so history isn't spammed). */
export function useUrlSync() {
  useEffect(() => {
    let last = '';
    const write = () => {
      const s = useStore.getState();
      const qs = toQueryString({ range: s.range, minMag: s.minMag, query: s.query, selectedId: s.selectedId, sort: s.sort });
      if (qs === last) return;
      last = qs;
      window.history.replaceState(null, '', `${window.location.pathname}${qs}${window.location.hash}`);
    };
    write();
    return useStore.subscribe(write);
  }, []);
}
