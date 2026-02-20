import { Router } from 'express';
import { dashboardConfigSchema } from '@networkman/shared';
import { ConfigRepository } from '../database/repositories/config.repository.js';

export function createConfigRoutes(configRepo: ConfigRepository): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    const config = configRepo.get();
    res.json(config);
  });

  router.put('/', (req, res) => {
    const parsed = dashboardConfigSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
    configRepo.save(parsed.data);
    res.json(parsed.data);
  });

  router.patch('/', (req, res) => {
    const config = configRepo.patch(req.body);
    res.json(config);
  });

  return router;
}
