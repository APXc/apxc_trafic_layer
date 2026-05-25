from __future__ import annotations

from typing import Any

import networkx as nx


def bpr_travel_time(t0: float, volume: float, capacity: float) -> float:
    capacity = max(capacity, 1.0)
    return t0 * (1.0 + 0.15 * (volume / capacity) ** 4)


def assign_traffic_frank_wolfe(
    graph: nx.MultiDiGraph,
    od_matrix: list[dict[str, Any]],
    iterations: int = 10,
) -> nx.MultiDiGraph:
    updated = graph.copy()

    for _ in range(iterations):
        for edge in updated.edges(keys=True, data=True):
            u, v, key, attrs = edge
            current_volume = float(attrs.get("volume", 0))
            capacity = float(attrs.get("capacity", 1200))
            freeflow_speed = float(attrs.get("speed_kph", 40))
            length_km = float(attrs.get("length", 1000)) / 1000
            t0 = max((length_km / max(freeflow_speed, 5)) * 60, 0.1)
            attrs["travel_time_min"] = bpr_travel_time(t0, current_volume, capacity)

        for demand in od_matrix:
            path = demand.get("path", [])
            flow = float(demand.get("flow", 0))
            if not path:
                continue
            for source, target in zip(path[:-1], path[1:]):
                if updated.has_edge(source, target):
                    first_key = next(iter(updated[source][target]))
                    updated[source][target][first_key]["volume"] = updated[source][target][first_key].get("volume", 0) + (
                        flow / iterations
                    )

    return updated


def compute_network_metrics(graph: nx.MultiDiGraph) -> dict[str, float]:
    speeds = []
    saturations = []
    travel_times = []
    critical = 0

    for _u, _v, _key, attrs in graph.edges(keys=True, data=True):
        speed = float(attrs.get("speed_kph", 40))
        capacity = float(attrs.get("capacity", 1200))
        volume = float(attrs.get("volume", 0))
        travel_time = float(attrs.get("travel_time_min", 1))

        saturation = min(volume / max(capacity, 1), 2.0)
        speeds.append(speed)
        saturations.append(saturation)
        travel_times.append(travel_time)
        if saturation > 0.8:
            critical += 1

    if not speeds:
        return {
            "avg_speed_kph": 0.0,
            "avg_saturation_pct": 0.0,
            "critical_edges": 0,
            "avg_travel_time_min": 0.0,
        }

    return {
        "avg_speed_kph": round(sum(speeds) / len(speeds), 2),
        "avg_saturation_pct": round((sum(saturations) / len(saturations)) * 100, 2),
        "critical_edges": critical,
        "avg_travel_time_min": round(sum(travel_times) / len(travel_times), 2),
    }


def generate_od_matrix(graph: nx.MultiDiGraph, demand_profile: dict[str, float]) -> list[dict[str, Any]]:
    nodes = list(graph.nodes)
    if len(nodes) < 2:
        return []

    source = nodes[0]
    target = nodes[-1]
    try:
        path = nx.shortest_path(graph, source=source, target=target)
    except Exception:
        path = [source, target]

    return [
        {
            "source": source,
            "target": target,
            "path": path,
            "flow": float(demand_profile.get("flow", 400)),
        }
    ]
