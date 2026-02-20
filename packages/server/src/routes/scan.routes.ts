import { Router } from 'express';
import type { NetworkScannerService } from '../services/network-scanner.service.js';
import type { ConfigRepository } from '../database/repositories/config.repository.js';

export function createScanRoutes(scanner: NetworkScannerService, configRepo: ConfigRepository): Router {
  const router = Router();

  router.post('/', async (_req, res) => {
    if (scanner.isScanning()) {
      res.status(409).json({ error: 'Scan already in progress' });
      return;
    }
    const config = configRepo.get();
    const result = await scanner.scan(config);
    res.json(result);
  });

  router.get('/status', (_req, res) => {
    res.json({ scanning: scanner.isScanning() });
  });

  router.post('/abort', (_req, res) => {
    if (!scanner.isScanning()) {
      res.status(400).json({ error: 'No scan in progress' });
      return;
    }
    scanner.abort();
    res.json({ message: 'Abort requested' });
  });

  return router;
}
