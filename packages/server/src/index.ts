import { createServer } from 'node:http';
import { createApp } from './app.js';
import { getDatabase, closeDatabase } from './database/connection.js';
import { migrate001 } from './database/migrations/001-initial.js';
import { DeviceRepository } from './database/repositories/device.repository.js';
import { AlertRepository } from './database/repositories/alert.repository.js';
import { MetricsRepository } from './database/repositories/metrics.repository.js';
import { ConfigRepository } from './database/repositories/config.repository.js';
import { NetworkScannerService } from './services/network-scanner.service.js';
import { HealthMonitorService } from './services/health-monitor.service.js';
import { AlertEngineService } from './services/alert-engine.service.js';
import { MetricsCollectorService } from './services/metrics-collector.service.js';
import { createWebSocketServer, type TypedIO } from './websocket/ws-server.js';
import { loadServerConfig } from './config.js';
import { logger } from './utils/logger.js';

async function main() {
  const serverConfig = loadServerConfig();
  logger.info('Starting NetworkMan server...');

  // Database
  const db = getDatabase(serverConfig.dataDir);
  migrate001(db);
  logger.info('Database initialized');

  // Repositories
  const deviceRepo = new DeviceRepository(db);
  const alertRepo = new AlertRepository(db);
  const metricsRepo = new MetricsRepository(db);
  const configRepo = new ConfigRepository(db);

  // Load dashboard config
  const dashConfig = configRepo.get();

  // WebSocket placeholder (will be set after server creation)
  let io: TypedIO;

  // Services
  const alertEngine = new AlertEngineService(alertRepo, (alert) => {
    io?.emit('alert:new', alert);
  });

  const scanner = new NetworkScannerService(
    deviceRepo,
    (progress) => io?.emit('scan:progress', progress),
    (device) => io?.emit('device:discovered', device),
  );

  const healthMonitor = new HealthMonitorService(
    deviceRepo,
    metricsRepo,
    alertEngine,
    (device) => io?.emit('device:updated', device),
    (deviceId, prev, next, device) => io?.emit('device:status-changed', { deviceId, previousStatus: prev, newStatus: next, device }),
    (metrics) => io?.emit('metrics:update', metrics),
  );

  const metricsCollector = new MetricsCollectorService(metricsRepo);

  // Express app
  const app = createApp({ deviceRepo, alertRepo, metricsRepo, configRepo, scanner });
  const httpServer = createServer(app);

  // WebSocket
  io = createWebSocketServer(httpServer);

  // Wire up WebSocket event handlers
  io.on('connection', (socket) => {
    socket.on('devices:request-list', () => {
      const devices = deviceRepo.findAll();
      socket.emit('devices:list', devices);
    });

    socket.on('scan:trigger', async () => {
      const config = configRepo.get();
      const result = await scanner.scan(config);
      io.emit('scan:complete', result);
    });

    socket.on('alert:acknowledge', (alertId) => {
      const alert = alertRepo.acknowledge(alertId);
      if (alert) io.emit('alert:acknowledged', alert);
    });
  });

  // Start services
  healthMonitor.start(dashConfig);
  metricsCollector.startPurgeSchedule(dashConfig.metricsRetentionDays);

  // Initial scan
  logger.info('Running initial network scan...');
  scanner.scan(dashConfig).then((result) => {
    io.emit('scan:complete', result);
  });

  // Start listening
  httpServer.listen(serverConfig.port, () => {
    logger.info(`NetworkMan server running on http://localhost:${serverConfig.port}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    logger.info('Shutting down...');
    healthMonitor.stop();
    metricsCollector.stop();
    closeDatabase();
    httpServer.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
