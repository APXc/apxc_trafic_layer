import { Router } from 'express';

export function createSimulationRouter({ redis, addSimulationJob }) {
  const router = Router();

  router.post('/', async (req, res, next) => {
    try {
      const { scenarioId, weatherConfig } = req.body;
      const job = await addSimulationJob({ scenarioId, weatherConfig });
      await redis.set(
        `simulation:status:${job.id}`,
        JSON.stringify({ status: 'queued', progress: 0, currentHour: 0 }),
        'EX',
        60 * 60 * 24
      );
      res.status(202).json({ jobId: String(job.id) });
    } catch (error) {
      next(error);
    }
  });

  router.get('/:jobId/status', async (req, res, next) => {
    try {
      const status = await redis.get(`simulation:status:${req.params.jobId}`);
      if (!status) return res.status(404).json({ error: 'Status not found' });
      res.json(JSON.parse(status));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
