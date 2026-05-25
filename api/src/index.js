import 'dotenv/config';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { createSimulationRouter } from './routes/simulation.js';
import { createScenariosRouter } from './routes/scenarios.js';
import { createWeatherRouter } from './routes/weather.js';
import { redis, cacheGet, cacheSet } from './services/redis.js';
import { addSimulationJob } from './services/queue.js';
import { initDb, pool } from './services/db.js';
import { setupWebsocket } from './websocket.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api' });
});

app.use('/api/scenarios', createScenariosRouter({ pool }));
app.use('/api/simulation', createSimulationRouter({ redis, addSimulationJob }));
app.use('/api/weather', createWeatherRouter({ cacheGet, cacheSet }));

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

await initDb();
await setupWebsocket(io);

const port = Number(process.env.PORT || 4000);
server.listen(port, () => {
  console.log(`API listening on ${port}`);
});
