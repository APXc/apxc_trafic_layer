import 'dotenv/config';
import axios from 'axios';
import { Worker } from 'bullmq';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

const pythonSimUrl = process.env.PYTHON_SIM_URL || 'http://python-sim:8000';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

new Worker(
  'simulation-jobs',
  async (job) => {
    const { scenarioId, weatherConfig, cityId, cityName, lat, lon } = job.data;

    await redis.set(
      `simulation:status:${job.id}`,
      JSON.stringify({ status: 'running', progress: 0, currentHour: 0 }),
      'EX',
      60 * 60 * 24
    );

    const { data: task } = await axios.post(`${pythonSimUrl}/simulate`, {
      scenarioId,
      weatherConfig,
      cityId: cityId || 'bergamo',
      cityName: cityName || 'Bergamo, Italy',
      lat: lat || 45.6983,
      lon: lon || 9.6773
    });

    let statusPayload = { status: 'running', progress: 0, currentHour: 0 };

    while (statusPayload.status !== 'completed' && statusPayload.status !== 'failed') {
      const { data } = await axios.get(`${pythonSimUrl}/simulate/${task.task_id}/status`);
      statusPayload = data;

      await redis.publish(`simulation:progress:${job.id}`, JSON.stringify(statusPayload));
      await redis.set(`simulation:status:${job.id}`, JSON.stringify(statusPayload), 'EX', 60 * 60 * 24);

      if (statusPayload.status !== 'completed' && statusPayload.status !== 'failed') {
        await sleep(2000);
      }
    }

    if (statusPayload.status === 'completed') {
      await redis.set(`simulation:result:${job.id}`, JSON.stringify(statusPayload.result), 'EX', 60 * 60 * 24);
    }

    return statusPayload;
  },
  {
    connection: redis
  }
);

console.log('Simulation worker started');
