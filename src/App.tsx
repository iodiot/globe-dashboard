import { lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { FiltersPanel } from './components/FiltersPanel';
import { QuakeList } from './components/QuakeList';
import { KpiCards } from './components/KpiCards';
import { TimelinePanel } from './components/TimelinePanel';
import { MagnitudeChart } from './components/MagnitudeChart';
import { DetailCard } from './components/DetailCard';
import { Tooltip } from './components/Tooltip';
import { Legend } from './components/Legend';
import { useQuakeData } from './hooks/useQuakeData';
import { useUrlSync } from './hooks/useUrlSync';
import { useThemeEffect } from './hooks/useThemeEffect';
import { usePlayback } from './hooks/usePlayback';
import { useShortcuts } from './hooks/useShortcuts';
import { useStore } from './state/store';
import { fmtDateTime } from './lib/format';

// three.js + R3F live in their own chunk so the dashboard shell paints first.
const GlobeCanvas = lazy(() => import('./components/globe/GlobeCanvas'));

export default function App() {
  useQuakeData();
  useUrlSync();
  useThemeEffect();
  usePlayback();
  useShortcuts();
  const ds = useStore((s) => s.dataset);
  const status = useStore((s) => s.status);
  const error = useStore((s) => s.error);

  return (
    <div className="app">
      <a className="skip" href="#list-h">Skip to event list</a>
      <Header />
      {ds?.source === 'snapshot' && (
        <div className="banner" role="status">
          Live USGS feed unavailable, showing a <b>bundled snapshot</b> from {fmtDateTime(ds.generated)}. Retrying every 5 minutes.
        </div>
      )}
      {status === 'error' && <div className="banner error" role="alert">Could not load earthquake data: {error}</div>}
      <aside className="sidebar">
        <FiltersPanel />
        <QuakeList />
      </aside>
      <main className="main">
        <KpiCards />
        <div className="globe-wrap">
          <Suspense fallback={<div className="globe-loading">Loading globe…</div>}>
            <GlobeCanvas />
          </Suspense>
          <Legend />
          <DetailCard />
          <p className="globe-hint" aria-hidden="true">Drag to rotate · scroll to zoom · click a marker</p>
        </div>
        <div className="charts">
          <TimelinePanel />
          <MagnitudeChart />
        </div>
      </main>
      <Tooltip />
      <footer className="footer">
        Data: <a href="https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php" target="_blank" rel="noopener noreferrer">USGS Earthquake Hazards Program</a> (M2.5+, past 30 days) ·
        Imagery: NASA Blue Marble · Built by <a href="https://iodiot.github.io/" target="_blank" rel="noopener">Mike Smahin</a> ·
        <a href="https://github.com/iodiot/globe-dashboard" target="_blank" rel="noopener">Source</a>
        <span className="keys"> · Keys: <kbd>/</kbd> search <kbd>↑↓</kbd> list <kbd>Space</kbd> play <kbd>Esc</kbd> clear <kbd>T</kbd> theme</span>
      </footer>
    </div>
  );
}
