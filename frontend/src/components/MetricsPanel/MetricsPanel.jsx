function metricRow(label, value, baseline) {
  const delta = baseline != null && value != null ? value - baseline : null;
  const deltaClass = delta == null ? 'text-slate-500' : delta <= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className="flex items-center justify-between text-sm">
      <span>{label}</span>
      <span>
        {value ?? '--'}{' '}
        {delta != null && <span className={deltaClass}>({delta > 0 ? '+' : ''}{delta.toFixed(1)})</span>}
      </span>
    </div>
  );
}

export default function MetricsPanel({ metrics, baseline }) {
  return (
    <section className="space-y-2 rounded border border-slate-200 p-3">
      <h2 className="text-sm font-semibold">KPI rete</h2>
      {metricRow('Velocità media (km/h)', metrics?.avg_speed_kph, baseline?.avg_speed_kph)}
      {metricRow('Saturazione media (%)', metrics?.avg_saturation_pct, baseline?.avg_saturation_pct)}
      {metricRow('Archi critici', metrics?.critical_edges, baseline?.critical_edges)}
      {metricRow('Tempo medio percorrenza (min)', metrics?.avg_travel_time_min, baseline?.avg_travel_time_min)}

      <div className="pt-2 text-xs text-slate-500">Saturazione quartieri (mini chart)</div>
      <div className="flex h-10 items-end gap-1">
        {[32, 48, 65, 54, 78].map((h, idx) => (
          <div key={idx} className="flex-1 rounded-t bg-blue-400" style={{ height: `${h}%` }} />
        ))}
      </div>
    </section>
  );
}
