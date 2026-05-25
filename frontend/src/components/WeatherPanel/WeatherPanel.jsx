import { useEffect } from 'react';
import { useWeather } from '../../hooks/useWeather';

const conditions = [
  { key: 'clear', label: 'Sereno' },
  { key: 'light_rain', label: 'Pioggia leggera' },
  { key: 'heavy_rain', label: 'Pioggia forte' },
  { key: 'fog', label: 'Nebbia' },
  { key: 'snow', label: 'Neve' },
  { key: 'ice', label: 'Ghiaccio' },
  { key: 'strong_wind', label: 'Vento forte' }
];

export default function WeatherPanel({ weatherConfig, onChange }) {
  const { weather, loadWeather } = useWeather();

  useEffect(() => {
    loadWeather(45.69, 9.67);
  }, [loadWeather]);

  return (
    <section className="space-y-3 rounded border border-slate-200 p-3">
      <h2 className="text-sm font-semibold">Meteo</h2>
      <select
        className="w-full rounded border p-2 text-sm"
        value={weatherConfig.condition}
        onChange={(e) => onChange({ ...weatherConfig, condition: e.target.value })}
      >
        {conditions.map((c) => (
          <option key={c.key} value={c.key}>
            {c.label}
          </option>
        ))}
      </select>

      <input
        type="number"
        className="w-full rounded border p-2 text-sm"
        value={weatherConfig.temperature}
        onChange={(e) => onChange({ ...weatherConfig, temperature: Number(e.target.value) })}
        placeholder="Temperatura °C"
      />

      <div className="text-xs text-slate-500">
        <div>Meteo attuale: {weather.current?.condition || 'n/d'}</div>
        <div>Temperatura: {weather.current?.temperature ?? '--'} °C</div>
      </div>
    </section>
  );
}
