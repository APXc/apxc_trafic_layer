from __future__ import annotations

import networkx as nx

from app.models.graph import apply_what_if


class ScenarioManager:
    def apply_scenario(self, base_graph: nx.MultiDiGraph, scenario_config: dict) -> nx.MultiDiGraph:
        updated = base_graph.copy()
        changes = scenario_config.get("changes")

        if isinstance(changes, list):
            for change in changes:
                updated = apply_what_if(updated, change)
            return updated

        return apply_what_if(updated, scenario_config)

    def compare_scenarios(self, baseline_result: dict, scenario_result: dict) -> dict:
        baseline = baseline_result.get("metrics", {})
        scenario = scenario_result.get("metrics", {})
        return {
            key: round(float(scenario.get(key, 0)) - float(baseline.get(key, 0)), 3)
            for key in set(baseline.keys()) | set(scenario.keys())
        }
