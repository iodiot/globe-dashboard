const dtf = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const tf = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const df = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
const nf = new Intl.NumberFormat();

export const fmtDateTime = (t: number) => dtf.format(t);
export const fmtTime = (t: number) => tf.format(t);
export const fmtDay = (t: number) => df.format(t);
export const fmtNum = (n: number) => nf.format(n);

export function fmtAgo(t: number, now: number): string {
  const s = Math.round((t - now) / 1000);
  const a = Math.abs(s);
  if (a < 60) return rtf.format(s, 'second');
  if (a < 3600) return rtf.format(Math.round(s / 60), 'minute');
  if (a < 86400) return rtf.format(Math.round(s / 3600), 'hour');
  return rtf.format(Math.round(s / 86400), 'day');
}

export const fmtDepth = (km: number) => `${km.toFixed(km < 10 ? 1 : 0)} km`;
export function fmtLatLon(lat: number, lon: number) {
  return `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
}
