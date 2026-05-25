import { useCallback, useMemo, useState } from 'react';
import MapView from './components/Map/MapView';
import MunicipalitySelector from './components/MunicipalitySelector/MunicipalitySelector';
import WeatherPanel from './components/WeatherPanel/WeatherPanel';
import WhatIfPanel from './components/WhatIfEditor/WhatIfPanel';
import MetricsPanel from './components/MetricsPanel/MetricsPanel';
import SimulationPlayer from './components/SimulationPlayer/SimulationPlayer';
import { useSimulation } from './hooks/useSimulation';

const defaultWeather = { condition: 'clear', temperature: 20 };
const defaultCity = { id: 'bergamo', name: 'Bergamo', lat: 45.6983, lon: 9.6773, osm: 'Bergamo, Italy' };

export default function App() {
  const [municipality, setMunicipality] = useState(defaultCity);
  const [weatherConfig, setWeatherConfig] = useState(defaultWeather);
  const { simulationState, startSimulation, runQuickSimulation, controls } = useSimulation();

  const metrics = useMemo(() => simulationState.metrics ?? null, [simulationState.metrics]);

  const handleStartSimulation = useCallback(
    (scenarioId, weather) => startSimulation(scenarioId, weather, municipality),
    [startSimulation, municipality]
  );

  const handleQuickRun = useCallback(
    () => runQuickSimulation(weatherConfig, municipality),
    [runQuickSimulation, weatherConfig, municipality]
  );

  return (
    <div className="h-full w-full bg-slate-100 text-slate-900">
      <div className="flex h-full flex-col lg:flex-row">
        <aside className="w-full lg:w-96 overflow-y-auto border-r border-slate-200 bg-white p-4 space-y-4">
          <MunicipalitySelector selected={municipality} onSelect={setMunicipality} />
          <WeatherPanel weatherConfig={weatherConfig} onChange={setWeatherConfig} municipality={municipality} />

          <button
            className="w-full rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            onClick={handleQuickRun}
            disabled={simulationState.status === 'running' || simulationState.status === 'queued'}
          >
            ▶ Simula traffico attuale
          </button>

          <WhatIfPanel weatherConfig={weatherConfig} onStartSimulation={handleStartSimulation} municipality={municipality} />
          <MetricsPanel metrics={metrics} baseline={simulationState.baselineMetrics} />
        </aside>

        <main className="relative flex-1 min-h-[360px]">
          <MapView
            trafficData={simulationState.trafficData || []}
            center={municipality ? [municipality.lon, municipality.lat] : [9.67, 45.69]}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white/95 p-3">
            <SimulationPlayer
              state={simulationState}
              controls={controls}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
