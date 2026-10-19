import { create } from 'zustand';
import type { QuakeDataset, SortKey, TimeRange } from '../data/types';
import { parseUrlState } from './urlState';

export type Theme = 'dark' | 'light';
export type Status = 'loading' | 'ready' | 'error';

export interface Hover { id: string; x: number; y: number }

export interface DashboardState {
  dataset: QuakeDataset | null;
  status: Status;
  error: string | null;
  lastRefresh: number | null;

  range: TimeRange;
  minMag: number;
  query: string;
  sort: SortKey;

  selectedId: string | null;
  hover: Hover | null;
  /** Playback cursor (epoch ms). null = live end of the window. */
  cursor: number | null;
  playing: boolean;
  theme: Theme;
  /** Bumped to ask the camera to fly to the current selection again. */
  flyNonce: number;

  setDataset: (d: QuakeDataset) => void;
  setStatus: (s: Status, error?: string | null) => void;
  setRange: (r: TimeRange) => void;
  setMinMag: (m: number) => void;
  setQuery: (q: string) => void;
  setSort: (s: SortKey) => void;
  select: (id: string | null) => void;
  setHover: (h: Hover | null) => void;
  setCursor: (t: number | null) => void;
  setPlaying: (p: boolean) => void;
  toggleTheme: () => void;
  resetFilters: () => void;
}

const initialUrl = typeof window !== 'undefined' ? parseUrlState(window.location.search) : parseUrlState('');

function initialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('gd-theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export const useStore = create<DashboardState>()((set) => ({
  dataset: null,
  status: 'loading',
  error: null,
  lastRefresh: null,

  range: initialUrl.range,
  minMag: initialUrl.minMag,
  query: initialUrl.query,
  sort: initialUrl.sort,

  selectedId: initialUrl.selectedId,
  hover: null,
  cursor: null,
  playing: false,
  theme: initialTheme(),
  flyNonce: 0,

  setDataset: (dataset) => set({ dataset, status: 'ready', error: null, lastRefresh: Date.now() }),
  setStatus: (status, error = null) => set({ status, error }),
  setRange: (range) => set({ range, cursor: null, playing: false }),
  setMinMag: (minMag) => set({ minMag }),
  setQuery: (query) => set({ query }),
  setSort: (sort) => set({ sort }),
  select: (selectedId) => set((s) => ({ selectedId, flyNonce: s.flyNonce + 1 })),
  setHover: (hover) => set({ hover }),
  setCursor: (cursor) => set({ cursor }),
  setPlaying: (playing) => set({ playing }),
  toggleTheme: () =>
    set((s) => {
      const theme = s.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('gd-theme', theme);
      return { theme };
    }),
  resetFilters: () => set({ range: '7d', minMag: 2.5, query: '', cursor: null, playing: false }),
}));
