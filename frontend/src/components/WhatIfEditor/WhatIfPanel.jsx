import { useEffect, useState } from 'react';
import api from '../../services/api';

const scenarioTypes = ['add_road', 'block_road', 'reduce_capacity', 'road_works'];

export default function WhatIfPanel({ weatherConfig, onStartSimulation }) {
  const [scenarios, setScenarios] = useState([]);
  const [name, setName] = useState('Scenario demo');
  const [type, setType] = useState(scenarioTypes[0]);

  const loadScenarios = async () => {
    try {
      const { data } = await api.get('/scenarios');
      setScenarios(data);
    } catch {
      setScenarios([]);
    }
  };

  useEffect(() => {
    loadScenarios();
  }, []);

  const createScenario = async () => {
    await api.post('/scenarios', {
      municipality_id: 1,
      name,
      description: `Scenario ${type}`,
      config: { type }
    });
    await loadScenarios();
  };

  return (
    <section className="space-y-3 rounded border border-slate-200 p-3">
      <h2 className="text-sm font-semibold">What-if Scenarios</h2>

      <div className="space-y-2">
        <input className="w-full rounded border p-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="w-full rounded border p-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
          {scenarioTypes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button className="w-full rounded border border-slate-300 px-3 py-2 text-sm" onClick={createScenario}>
          Salva scenario
        </button>
      </div>

      <ul className="max-h-36 space-y-2 overflow-y-auto text-sm">
        {scenarios.map((scenario) => (
          <li key={scenario.id} className="flex items-center justify-between rounded bg-slate-100 p-2">
            <span>{scenario.name}</span>
            <button
              className="rounded bg-blue-600 px-2 py-1 text-xs text-white"
              onClick={() => onStartSimulation(scenario.id, weatherConfig)}
            >
              Simula
            </button>
          </li>
        ))}
      </ul>

      <p className="text-xs text-slate-500">Confronto baseline/scenario disponibile nei KPI dopo il run.</p>
    </section>
  );
}
