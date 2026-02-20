import { Router } from 'express';
import type { AlertSeverity } from '@networkman/shared';
import { AlertRepository } from '../database/repositories/alert.repository.js';

export function createAlertRoutes(alertRepo: AlertRepository): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const severity = req.query.severity as AlertSeverity | undefined;
    const acknowledged = req.query.acknowledged === undefined ? undefined : req.query.acknowledged === 'true';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const alerts = alertRepo.findAll({ severity, acknowledged, limit, offset });
    res.json(alerts);
  });

  router.get('/:id', (req, res) => {
    const alert = alertRepo.findById(req.params.id);
    if (!alert) { res.status(404).json({ error: 'Alert not found' }); return; }
    res.json(alert);
  });

  router.post('/:id/acknowledge', (req, res) => {
    const alert = alertRepo.acknowledge(req.params.id);
    if (!alert) { res.status(404).json({ error: 'Alert not found' }); return; }
    res.json(alert);
  });

  router.post('/acknowledge-all', (_req, res) => {
    const count = alertRepo.acknowledgeAll();
    res.json({ acknowledged: count });
  });

  router.delete('/:id', (req, res) => {
    const deleted = alertRepo.delete(req.params.id);
    if (!deleted) { res.status(404).json({ error: 'Alert not found' }); return; }
    res.status(204).send();
  });

  return router;
}
