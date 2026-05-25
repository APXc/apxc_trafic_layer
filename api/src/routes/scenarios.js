import { Router } from 'express';

export function createScenariosRouter({ pool }) {
  const router = Router();

  router.get('/', async (_, res, next) => {
    try {
      const { rows } = await pool.query('SELECT * FROM scenarios ORDER BY id DESC');
      res.json(rows);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const { municipality_id, name, description, config } = req.body;
      const { rows } = await pool.query(
        `INSERT INTO scenarios (municipality_id, name, description, config)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [municipality_id ?? 1, name, description ?? null, config ?? {}]
      );
      res.status(201).json(rows[0]);
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const { rows } = await pool.query('SELECT * FROM scenarios WHERE id = $1', [req.params.id]);
      if (!rows[0]) return res.status(404).json({ error: 'Scenario not found' });
      res.json(rows[0]);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const result = await pool.query('DELETE FROM scenarios WHERE id = $1', [req.params.id]);
      if (!result.rowCount) return res.status(404).json({ error: 'Scenario not found' });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
