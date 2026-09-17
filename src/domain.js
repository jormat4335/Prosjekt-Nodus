export function readingState(reading, sensor, now = Date.now()) {
  if (!reading) return 'missing';
  if (reading.quality !== 'good') return 'invalid';
  const age = now - Date.parse(reading.observed_at);
  if (!Number.isFinite(age) || age < -60000) return 'invalid';
  if (age > sensor.stale_after_seconds * 1000) return 'stale';
  return 'fresh';
}
export function siteState(sensors, readings, alarms, now = Date.now()) {
  if (alarms.some(a=>a.state==='active')) return 'alarm';
  if (!sensors.length || sensors.some(s=>readingState(readings.find(r=>r.sensor_id===s.id),s,now)!=='fresh')) return 'unknown';
  return 'normal';
}
export function escapeHtml(value) {return String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
