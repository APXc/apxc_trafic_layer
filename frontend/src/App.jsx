import { useMemo, useState } from 'react';
import MapView from './components/Map/MapView';
import WeatherPanel from './components/WeatherPanel/WeatherPanel';
import WhatIfPanel from './components/WhatIfEditor/WhatIfPanel';
import MetricsPanel from './components/MetricsPanel/MetricsPanel';
import SimulationPlayer from './components/SimulationPlayer/SimulationPlayer';
import { useSimulation } from './hooks/useSimulation';

const defaultWeather = { condition: 'clear', temperature: 20 };

export default function App() {
  const [weatherConfig, setWeatherConfig] = useState(defaultWeather);
  const { simulationState, startSimulation, controls } = useSimulation();

  const metrics = useMemo(() => simulationState.metrics ?? null, [simulationState.metrics]);

  return (
    <div className="h-full w-full bg-slate-100 text-slate-900">
      <div className="flex h-full flex-col lg:flex-row">
        <aside className="w-full lg:w-96 overflow-y-auto border-r border-slate-200 bg-white p-4 space-y-4">
          <WeatherPanel weatherConfig={weatherConfig} onChange={setWeatherConfig} />
          <WhatIfPanel weatherConfig={weatherConfig} onStartSimulation={startSimulation} />
          <MetricsPanel metrics={metrics} baseline={simulationState.baselineMetrics} />
        </aside>

        <main className="relative flex-1 min-h-[360px]">
          <MapView trafficData={simulationState.trafficData || []} />
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
