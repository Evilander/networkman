import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { createDeviceRoutes } from './routes/devices.routes.js';
import { createAlertRoutes } from './routes/alerts.routes.js';
import { createMetricsRoutes } from './routes/metrics.routes.js';
import { createConfigRoutes } from './routes/config.routes.js';
import { createScanRoutes } from './routes/scan.routes.js';
import { errorHandler } from './middleware/error-handler.js';
import type { DeviceRepository } from './database/repositories/device.repository.js';
import type { AlertRepository } from './database/repositories/alert.repository.js';
import type { MetricsRepository } from './database/repositories/metrics.repository.js';
import type { ConfigRepository } from './database/repositories/config.repository.js';
import type { NetworkScannerService } from './services/network-scanner.service.js';

interface AppDeps {
  deviceRepo: DeviceRepository;
  alertRepo: AlertRepository;
  metricsRepo: MetricsRepository;
  configRepo: ConfigRepository;
  scanner: NetworkScannerService;
}

export function createApp(deps: AppDeps) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Serve static client files in production
  const clientDist = path.resolve(import.meta.dirname, '../../client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
  }

  // API routes
  app.use('/api/devices', createDeviceRoutes(deps.deviceRepo));
  app.use('/api/alerts', createAlertRoutes(deps.alertRepo));
  app.use('/api/metrics', createMetricsRoutes(deps.metricsRepo));
  app.use('/api/config', createConfigRoutes(deps.configRepo));
  app.use('/api/scan', createScanRoutes(deps.scanner, deps.configRepo));

  // SPA fallback for production
  if (fs.existsSync(clientDist)) {
    app.get('{*path}', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use(errorHandler);

  return app;
}
