import { Queue } from 'bullmq';
import { redis } from './redis.js';

export const simulationQueue = new Queue('simulation-jobs', {
  connection: redis
});

export async function addSimulationJob(data) {
  const job = await simulationQueue.add('simulate', data, {
    removeOnComplete: 100,
    removeOnFail: 100
  });
  return job;
}
