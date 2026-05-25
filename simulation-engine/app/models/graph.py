from __future__ import annotations

from typing import Any

import networkx as nx

try:
    import osmnx as ox
except Exception:  # pragma: no cover
    ox = None

GRAPH_STORE: dict[str, nx.MultiDiGraph] = {}


def _fallback_graph() -> nx.MultiDiGraph:
    graph = nx.MultiDiGraph()
    graph.add_node(1, x=9.67, y=45.69)
    graph.add_node(2, x=9.69, y=45.69)
    graph.add_edge(1, 2, length=1200, speed_kph=40, capacity=1500, lanes=2, volume=500)
    return graph


def load_graph_from_osm(place_name: str) -> nx.MultiDiGraph:
    if ox is None:
        return _fallback_graph()

    try:
        graph = ox.graph_from_place(place_name, network_type="drive")
        return graph
    except Exception:
        return _fallback_graph()


def load_graph_from_db(city_id: str) -> nx.MultiDiGraph | None:
    return GRAPH_STORE.get(str(city_id))


def save_graph_to_db(graph: nx.MultiDiGraph, city_id: str) -> None:
    GRAPH_STORE[str(city_id)] = graph


def apply_what_if(graph: nx.MultiDiGraph, scenario: dict[str, Any]) -> nx.MultiDiGraph:
    updated = graph.copy()
    scenario_type = scenario.get("type")

    if scenario_type == "add_road":
        source = scenario.get("source", 1)
        target = scenario.get("target", 2)
        updated.add_edge(
            source,
            target,
            length=scenario.get("length", 800),
            speed_kph=scenario.get("speed_kph", 50),
            capacity=scenario.get("capacity", 1800),
            lanes=scenario.get("lanes", 2),
            volume=0,
        )

    elif scenario_type == "block_road":
        source = scenario.get("source")
        target = scenario.get("target")
        if source is not None and target is not None and updated.has_edge(source, target):
            updated.remove_edges_from([(source, target, key) for key in updated[source][target].keys()])

    elif scenario_type == "reduce_capacity":
        source = scenario.get("source")
        target = scenario.get("target")
        factor = float(scenario.get("factor", 0.7))
        if source is not None and target is not None and updated.has_edge(source, target):
            for key, attrs in updated[source][target].items():
                attrs["capacity"] = max(100, int(attrs.get("capacity", 1000) * factor))

    elif scenario_type == "road_works":
        source = scenario.get("source")
        target = scenario.get("target")
        lane_factor = float(scenario.get("lane_factor", 0.5))
        speed_factor = float(scenario.get("speed_factor", 0.6))
        if source is not None and target is not None and updated.has_edge(source, target):
            for key, attrs in updated[source][target].items():
                attrs["lanes"] = max(1, int(attrs.get("lanes", 2) * lane_factor))
                attrs["speed_kph"] = max(10, attrs.get("speed_kph", 50) * speed_factor)

    return updated
