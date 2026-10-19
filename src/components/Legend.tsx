import { MAG_LEGEND } from '../data/filters';

export function Legend() {
  return (
    <div className="legend" aria-label="Marker colour by magnitude">
      <span className="legend-title">Magnitude</span>
      {MAG_LEGEND.map((l) => (
        <span key={l.label} className="legend-item"><i style={{ background: l.color }} />{l.label}</span>
      ))}
      <span className="legend-item"><i className="ring" />recent</span>
    </div>
  );
}
