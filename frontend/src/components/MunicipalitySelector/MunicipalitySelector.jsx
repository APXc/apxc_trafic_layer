import { useState } from 'react';

const MUNICIPALITIES = [
  { id: 'bergamo', name: 'Bergamo', lat: 45.6983, lon: 9.6773, osm: 'Bergamo, Italy' },
  { id: 'milano', name: 'Milano', lat: 45.4642, lon: 9.1900, osm: 'Milano, Italy' },
  { id: 'roma', name: 'Roma', lat: 41.9028, lon: 12.4964, osm: 'Roma, Italy' },
  { id: 'torino', name: 'Torino', lat: 45.0703, lon: 7.6869, osm: 'Torino, Italy' },
  { id: 'firenze', name: 'Firenze', lat: 43.7696, lon: 11.2558, osm: 'Firenze, Italy' },
  { id: 'bologna', name: 'Bologna', lat: 44.4949, lon: 11.3426, osm: 'Bologna, Italy' },
  { id: 'napoli', name: 'Napoli', lat: 40.8518, lon: 14.2681, osm: 'Napoli, Italy' },
  { id: 'verona', name: 'Verona', lat: 45.4384, lon: 10.9917, osm: 'Verona, Italy' },
  { id: 'brescia', name: 'Brescia', lat: 45.5416, lon: 10.2118, osm: 'Brescia, Italy' },
  { id: 'padova', name: 'Padova', lat: 45.4064, lon: 11.8768, osm: 'Padova, Italy' },
];

export default function MunicipalitySelector({ selected, onSelect }) {
  const [customName, setCustomName] = useState('');

  const handleChange = (e) => {
    const cityId = e.target.value;
    const city = MUNICIPALITIES.find((m) => m.id === cityId);
    if (city) onSelect(city);
  };

  const handleCustom = () => {
    if (!customName.trim()) return;
    const custom = {
      id: customName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      name: customName.trim(),
      lat: selected?.lat || 45.69,
      lon: selected?.lon || 9.67,
      osm: `${customName.trim()}, Italy`
    };
    onSelect(custom);
    setCustomName('');
  };

  return (
    <section className="space-y-3 rounded border border-slate-200 p-3">
      <h2 className="text-sm font-semibold">🏙️ Comune</h2>
      <select
        className="w-full rounded border p-2 text-sm"
        value={selected?.id || ''}
        onChange={handleChange}
      >
        <option value="" disabled>Seleziona comune...</option>
        {MUNICIPALITIES.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded border p-2 text-sm"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="Altro comune..."
          onKeyDown={(e) => e.key === 'Enter' && handleCustom()}
        />
        <button
          className="rounded border border-slate-300 px-2 py-1 text-xs"
          onClick={handleCustom}
        >
          +
        </button>
      </div>

      {selected && (
        <div className="text-xs text-slate-500">
          Selezionato: <strong>{selected.name}</strong> ({selected.lat.toFixed(4)}, {selected.lon.toFixed(4)})
        </div>
      )}
    </section>
  );
}

export { MUNICIPALITIES };
