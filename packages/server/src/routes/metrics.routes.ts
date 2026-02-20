import { Router } from 'express';
import { MetricsRepository } from '../database/repositories/metrics.repository.js';

export function createMetricsRoutes(metricsRepo: MetricsRepository): Router {
  const router = Router();

  router.get('/summary', (_req, res) => {
    const summary = metricsRepo.getSummary();
    res.json(summary);
  });

  router.get('/:deviceId/latest', (req, res) => {
    const metrics = metricsRepo.getLatest(req.params.deviceId);
    if (!metrics) { res.status(404).json({ error: 'No metrics found' }); return; }
    res.json(metrics);
  });

  router.get('/:deviceId', (req, res) => {
    const { from, to, interval } = req.query;
    if (!from || !to) { res.status(400).json({ error: 'from and to query parameters are required' }); return; }

    if (interval) {
      const aggregated = metricsRepo.getAggregated(
        req.params.deviceId,
        from as string,
        to as string,
        parseInt(interval as string, 10),
      );
      res.json(aggregated);
    } else {
      const metrics = metricsRepo.findByDevice(req.params.deviceId, from as string, to as string);
      res.json(metrics);
    }
  });

  return router;
}
