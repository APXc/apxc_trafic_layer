from __future__ import annotations

from typing import Callable

import simpy

from app.models.traffic import assign_traffic_frank_wolfe, compute_network_metrics, generate_od_matrix


class TrafficSimulator:
    def __init__(self, graph, od_matrix, weather_config, time_step_minutes: int = 15):
        self.graph = graph
        self.base_od_matrix = od_matrix
        self.weather_config = weather_config
        self.time_step_minutes = time_step_minutes
        self.env = simpy.Environment()

    def run(self, hours: int = 24, progress_callback: Callable | None = None):
        steps = int((hours * 60) / self.time_step_minutes)
        baseline_metrics = None
        last_metrics = None
        edge_flows = []

        for step in range(steps):
            demand_factor = self.weather_config.get("demand_factor", 1.0)
            od_matrix = [
                {**row, "flow": row.get("flow", 0) * demand_factor}
                for row in self.base_od_matrix
            ]
            self.graph = assign_traffic_frank_wolfe(self.graph, od_matrix, iterations=2)
            last_metrics = compute_network_metrics(self.graph)
            if baseline_metrics is None:
                baseline_metrics = last_metrics

            current_hour = (step * self.time_step_minutes) / 60
            progress = round(((step + 1) / steps) * 100, 2)

            edge_flows = [
                {
                    "source": [self.graph.nodes[u].get("x", 9.67), self.graph.nodes[u].get("y", 45.69)],
                    "target": [self.graph.nodes[v].get("x", 9.68), self.graph.nodes[v].get("y", 45.70)],
                    "volume": attrs.get("volume", 0),
                    "saturation": attrs.get("volume", 0) / max(attrs.get("capacity", 1200), 1),
                }
                for u, v, _k, attrs in self.graph.edges(keys=True, data=True)
            ]

            if progress_callback:
                progress_callback(current_hour, progress, last_metrics, edge_flows, baseline_metrics)

            self.env.run(until=self.env.now + 1)

        return {
            "metrics": last_metrics,
            "baseline_metrics": baseline_metrics,
            "edge_flows": edge_flows,
        }
