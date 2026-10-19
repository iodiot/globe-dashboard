import { useEffect } from 'react';
import { useStore } from '../state/store';

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) && (el as HTMLInputElement).type !== 'range';

/** Global shortcuts: "/" search, Esc clear selection, Space play/pause, T theme. */
export function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const s = useStore.getState();
      if (e.key === 'Escape') {
        if (isTyping(e.target)) (e.target as HTMLElement).blur();
        else if (s.selectedId) s.select(null);
        return;
      }
      if (isTyping(e.target)) return;
      if (e.key === '/') {
        e.preventDefault();
        document.getElementById('region-search')?.focus();
      } else if (e.key === ' ' && !(e.target instanceof HTMLButtonElement) && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        s.setPlaying(!s.playing);
      } else if (e.key === 't' || e.key === 'T') {
        s.toggleTheme();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
