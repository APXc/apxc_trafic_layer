from __future__ import annotations

import httpx
import networkx as nx

WEATHER_IMPACT = {
    "clear": {"speed_factor": 1.0, "capacity_factor": 1.0, "demand_factor": 1.0},
    "light_rain": {"speed_factor": 0.9, "capacity_factor": 0.9, "demand_factor": 1.05},
    "heavy_rain": {"speed_factor": 0.75, "capacity_factor": 0.8, "demand_factor": 1.1},
    "fog": {"speed_factor": 0.8, "capacity_factor": 0.85, "demand_factor": 1.0},
    "snow": {"speed_factor": 0.65, "capacity_factor": 0.7, "demand_factor": 0.9},
    "ice": {"speed_factor": 0.55, "capacity_factor": 0.65, "demand_factor": 0.85},
    "strong_wind": {"speed_factor": 0.85, "capacity_factor": 0.9, "demand_factor": 1.0},
}


def apply_weather_to_graph(graph: nx.MultiDiGraph, weather_condition: str, temperature: float) -> nx.MultiDiGraph:
    impact = WEATHER_IMPACT.get(weather_condition, WEATHER_IMPACT["clear"])
    updated = graph.copy()

    for _u, _v, _key, attrs in updated.edges(keys=True, data=True):
        attrs["speed_kph"] = max(5, float(attrs.get("speed_kph", 40)) * impact["speed_factor"])
        attrs["capacity"] = max(100, int(float(attrs.get("capacity", 1200)) * impact["capacity_factor"]))
        attrs["temperature"] = temperature

    return updated


async def fetch_openmeteo(lat: float, lon: float) -> dict:
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,weather_code",
    }

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()

    return {
        "temperature": data.get("current", {}).get("temperature_2m"),
        "condition": data.get("current", {}).get("weather_code"),
    }
