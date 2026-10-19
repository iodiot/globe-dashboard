import { useState } from 'react';
import { useStore } from '../state/store';
import { fmtDateTime, fmtTime } from '../lib/format';

export function Header() {
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const ds = useStore((s) => s.dataset);
  const status = useStore((s) => s.status);
  const [copied, setCopied] = useState(false);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy this link', window.location.href);
    }
  };

  return (
    <header className="header">
      <div className="brand">
        <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
          <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="2" opacity=".35" />
          <path d="M3 17h6l3-7 4 14 3-9 2 4h8" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        <div>
          <h1>Seismic Globe</h1>
          <p>Global earthquake activity, USGS real-time feed</p>
        </div>
      </div>
      <div className="header-actions">
        {status === 'loading' && <span className="pill">Loading…</span>}
        {ds?.source === 'live' && (
          <span className="pill live" title={`Feed generated ${fmtDateTime(ds.generated)}`}>
            <span className="dot" aria-hidden="true" /> Live · updated {fmtTime(ds.generated)}
          </span>
        )}
        {ds?.source === 'snapshot' && (
          <span className="pill snapshot" title="The live USGS feed could not be reached; showing bundled data">
            Snapshot · {fmtDateTime(ds.generated)}
          </span>
        )}
        <button className="icon-btn" onClick={share} aria-label="Copy shareable link">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          <span className="btn-label">{copied ? 'Copied!' : 'Share'}</span>
        </button>
        <button className="icon-btn" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title="Toggle theme (T)">
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
          )}
        </button>
      </div>
    </header>
  );
}
