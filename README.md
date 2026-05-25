# apxc_trafic_layer

Micro simulatore di traffico urbano con frontend interattivo React, API Node.js, motore statistico Python e supporto scenari what-if/meteo.

## Prerequisiti

- Docker
- Docker Compose

## Quickstart

```bash
cp .env.example .env
docker-compose up --build
```

UI: http://localhost:3000  
API: http://localhost:4000/health  
Simulation Engine: http://localhost:8000/health

## Architettura

- **frontend** (React + Vite + MapLibre + Deck.gl): mappa, player, pannelli meteo/scenari/KPI.
- **api** (Express + Socket.io + BullMQ): CRUD scenari, avvio simulazioni, proxy meteo, broadcast progress.
- **worker** (BullMQ): esegue job e orchestration verso motore Python.
- **python-sim** (FastAPI + SimPy + networkx): simulazione 24h, meteo, applicazione scenari.
- **postgres/postgis**: persistenza scenari, risultati, rete stradale.
- **redis**: queue, cache e pub/sub progress.

## Endpoints API principali

- `GET /health`
- `GET /api/scenarios`
- `POST /api/scenarios`
- `GET /api/scenarios/:id`
- `DELETE /api/scenarios/:id`
- `POST /api/simulation`
- `GET /api/simulation/:jobId/status`
- `GET /api/weather?lat=45.69&lon=9.67`

## Come aggiungere un nuovo scenario what-if

1. Creare scenario via `POST /api/scenarios`:
   - `type`: `add_road`, `block_road`, `reduce_capacity`, `road_works`
   - `config`: payload scenario
2. Avviare simulazione via `POST /api/simulation` con `scenarioId` e `weatherConfig`.
3. Sottoscrivere websocket `simulation:progress:{jobId}` per aggiornamenti realtime.

## Sviluppo locale (hot reload)

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

## Roadmap

- [x] Skeleton completo multi-servizio
- [x] Simulazione statistica base + scenari + meteo
- [ ] Calibrazione OD con dati reali comunali
- [ ] Import/export scenari e report PDF
- [ ] Dashboard comparativa multi-scenario avanzata
- [ ] Ottimizzazione semaforica automatica
