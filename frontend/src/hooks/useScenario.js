import { useMemo, useState } from 'react';

export function useScenario(initialScenarios = []) {
  const [scenarios, setScenarios] = useState(initialScenarios);
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);

  const selectedScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? null,
    [scenarios, selectedScenarioId]
  );

  return {
    scenarios,
    setScenarios,
    selectedScenarioId,
    setSelectedScenarioId,
    selectedScenario
  };
}
