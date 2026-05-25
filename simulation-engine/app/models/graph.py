from __future__ import annotations

import hashlib
import math
import random
from typing import Any

import networkx as nx

try:
    import osmnx as ox
except Exception:  # pragma: no cover
    ox = None

GRAPH_STORE: dict[str, nx.MultiDiGraph] = {}


def _fallback_graph() -> nx.MultiDiGraph:
    """Minimal 2-node graph used only as a last-resort placeholder."""
    graph = nx.MultiDiGraph()
    graph.add_node(1, x=9.67, y=45.69)
    graph.add_node(2, x=9.69, y=45.69)
    graph.add_edge(1, 2, length=1200, speed_kph=40, capacity=1500, lanes=2, volume=500)
    return graph


def generate_demo_graph(center_lat: float, center_lon: float, city_id: str = "demo") -> nx.MultiDiGraph:
    """
    Generate a realistic demo road network grid centered on the given coordinates.
    Creates a grid of ~12x12 intersections with connecting roads, radial avenues,
    and ring roads to simulate a typical Italian city center. ~200+ edges.
    """
    graph = nx.MultiDiGraph()
    seed = int(hashlib.sha256(city_id.encode()).hexdigest(), 16) % 2**31
    random.seed(seed)

    # Grid parameters
    grid_size = 10  # 10x10 grid of intersections
    spacing_lat = 0.0018  # ~200m between intersections (latitude)
    spacing_lon = 0.0025  # ~200m between intersections (longitude)

    # Road type profiles
    road_types = {
        "primary": {"speed_kph": 50, "capacity": 1800, "lanes": 3},
        "secondary": {"speed_kph": 40, "capacity": 1200, "lanes": 2},
        "tertiary": {"speed_kph": 30, "capacity": 800, "lanes": 1},
        "residential": {"speed_kph": 30, "capacity": 600, "lanes": 1},
    }

    # Create grid nodes
    node_id = 1
    node_map = {}  # (row, col) -> node_id

    start_lat = center_lat - (grid_size / 2) * spacing_lat
    start_lon = center_lon - (grid_size / 2) * spacing_lon

    for row in range(grid_size):
        for col in range(grid_size):
            lat = start_lat + row * spacing_lat + random.uniform(-0.0002, 0.0002)
            lon = start_lon + col * spacing_lon + random.uniform(-0.0003, 0.0003)
            graph.add_node(node_id, x=lon, y=lat)
            node_map[(row, col)] = node_id
            node_id += 1

    def _add_road(src, dst, road_type_key):
        profile = road_types[road_type_key]
        src_data = graph.nodes[src]
        dst_data = graph.nodes[dst]
        dx = (dst_data["x"] - src_data["x"]) * 111320 * math.cos(math.radians(src_data["y"]))
        dy = (dst_data["y"] - src_data["y"]) * 110540
        length = math.sqrt(dx * dx + dy * dy)
        volume = random.randint(100, int(profile["capacity"] * 0.9))
        graph.add_edge(src, dst, length=length, volume=volume, **profile)
        # Add reverse direction with slightly different volume
        graph.add_edge(dst, src, length=length, volume=random.randint(80, volume), **profile)

    # Create horizontal roads
    for row in range(grid_size):
        for col in range(grid_size - 1):
            src = node_map[(row, col)]
            dst = node_map[(row, col + 1)]
            # Central roads are primary, edges are residential
            if row == grid_size // 2:
                _add_road(src, dst, "primary")
            elif row in (grid_size // 4, 3 * grid_size // 4):
                _add_road(src, dst, "secondary")
            else:
                rtype = random.choice(["tertiary", "residential"])
                _add_road(src, dst, rtype)

    # Create vertical roads
    for col in range(grid_size):
        for row in range(grid_size - 1):
            src = node_map[(row, col)]
            dst = node_map[(row + 1, col)]
            if col == grid_size // 2:
                _add_road(src, dst, "primary")
            elif col in (grid_size // 4, 3 * grid_size // 4):
                _add_road(src, dst, "secondary")
            else:
                rtype = random.choice(["tertiary", "residential"])
                _add_road(src, dst, rtype)

    # Add some diagonal avenues (radial roads from center)
    center_node = node_map[(grid_size // 2, grid_size // 2)]
    corners = [
        (0, 0), (0, grid_size - 1),
        (grid_size - 1, 0), (grid_size - 1, grid_size - 1)
    ]
    for cr, cc in corners:
        corner_node = node_map[(cr, cc)]
        # Connect center to corners via intermediate nodes
        mid_r = (grid_size // 2 + cr) // 2
        mid_c = (grid_size // 2 + cc) // 2
        mid_node = node_map[(mid_r, mid_c)]
        _add_road(center_node, mid_node, "secondary")
        _add_road(mid_node, corner_node, "secondary")

    # Add a ring road connecting the outer edges
    ring_nodes = []
    for col in range(grid_size):
        ring_nodes.append(node_map[(0, col)])
    for row in range(1, grid_size):
        ring_nodes.append(node_map[(row, grid_size - 1)])
    for col in range(grid_size - 2, -1, -1):
        ring_nodes.append(node_map[(grid_size - 1, col)])
    for row in range(grid_size - 2, 0, -1):
        ring_nodes.append(node_map[(row, 0)])

    for i in range(len(ring_nodes)):
        src = ring_nodes[i]
        dst = ring_nodes[(i + 1) % len(ring_nodes)]
        if not graph.has_edge(src, dst):
            _add_road(src, dst, "secondary")

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
