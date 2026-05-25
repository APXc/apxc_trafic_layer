from __future__ import annotations

import asyncio
import uuid
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.models.graph import load_graph_from_db, load_graph_from_osm, save_graph_to_db, generate_demo_graph
from app.models.traffic import generate_od_matrix
from app.models.weather import WEATHER_IMPACT, apply_weather_to_graph
from app.simulation.engine import TrafficSimulator
from app.simulation.scenarios import ScenarioManager

app = FastAPI(title="apxc traffic simulation engine")
TASKS: dict[str, dict[str, Any]] = {}
scenario_manager = ScenarioManager()


class WeatherConfig(BaseModel):
    condition: str = "clear"
    temperature: float = 20


class SimulateRequest(BaseModel):
    scenarioId: int | None = None
    scenarioConfig: dict[str, Any] = Field(default_factory=dict)
    weatherConfig: WeatherConfig = WeatherConfig()
    cityId: str = "bergamo"
    cityName: str = "Bergamo, Italy"
    lat: float = 45.6983
    lon: float = 9.6773


class GraphLoadRequest(BaseModel):
    city_id: str = "bergamo"
    place_name: str


async def _run_simulation(task_id: str, request: SimulateRequest):
    TASKS[task_id] = {"status": "running", "progress": 0, "currentHour": 0, "result": None}

    try:
        city_id = request.cityId or "bergamo"
        graph = load_graph_from_db(city_id)
        if graph is None:
            # Try loading from OSM, fall back to demo graph centered on the city
            graph = load_graph_from_osm(request.cityName or "Bergamo, Italy")
            # If we got the minimal fallback (osmnx not available), generate a proper demo
            if graph.number_of_edges() < 5:
                graph = generate_demo_graph(request.lat, request.lon, city_id)
            save_graph_to_db(graph, city_id)

        scenario_config = request.scenarioConfig or {}
        if request.scenarioId and not scenario_config:
            scenario_config = {"type": "reduce_capacity", "source": 1, "target": 2, "factor": 0.85}

        modified = scenario_manager.apply_scenario(graph, scenario_config) if scenario_config else graph

        condition = request.weatherConfig.condition
        temp = request.weatherConfig.temperature
        weather_graph = apply_weather_to_graph(modified, condition, temp)

        impact = WEATHER_IMPACT.get(condition, WEATHER_IMPACT["clear"])
        od_matrix = generate_od_matrix(weather_graph, {"flow": 500 * impact["demand_factor"]})
        simulator = TrafficSimulator(weather_graph, od_matrix, impact)

        def progress_callback(hour, progress, metrics, edge_flows, baseline_metrics):
            TASKS[task_id].update(
                {
                    "status": "running",
                    "progress": progress,
                    "currentHour": round(hour, 2),
                    "trafficData": edge_flows,
                    "metrics": metrics,
                    "baselineMetrics": baseline_metrics,
                }
            )

        result = simulator.run(hours=24, progress_callback=progress_callback)
        TASKS[task_id].update({"status": "completed", "progress": 100, "result": result})
    except Exception as exc:  # pragma: no cover
        TASKS[task_id].update({"status": "failed", "error": str(exc)})


@app.get("/health")
async def health():
    return {"status": "ok", "service": "python-sim"}


@app.post("/simulate")
async def simulate(request: SimulateRequest):
    task_id = str(uuid.uuid4())
    asyncio.create_task(_run_simulation(task_id, request))
    return {"task_id": task_id}


@app.get("/simulate/{task_id}/status")
async def simulation_status(task_id: str):
    status = TASKS.get(task_id)
    if not status:
        raise HTTPException(status_code=404, detail="task not found")
    return status


@app.post("/graph/load")
async def graph_load(request: GraphLoadRequest):
    graph = load_graph_from_osm(request.place_name)
    save_graph_to_db(graph, request.city_id)
    return {"city_id": request.city_id, "nodes": graph.number_of_nodes(), "edges": graph.number_of_edges()}


@app.get("/graph/{city_id}")
async def graph_info(city_id: str):
    graph = load_graph_from_db(city_id)
    if graph is None:
        raise HTTPException(status_code=404, detail="graph not found")
    return {"city_id": city_id, "nodes": graph.number_of_nodes(), "edges": graph.number_of_edges()}
