/**
 * NetworkMan Packaging Script
 *
 * Creates a self-contained portable distribution:
 * 1. Downloads a portable Node.js for Windows
 * 2. Bundles the compiled server + client
 * 3. Creates a launcher (networkman.bat and networkman.exe wrapper)
 *
 * Result: dist/NetworkMan/ folder — zip it and ship it.
 * Your coworker double-clicks networkman.bat and the dashboard opens.
 *
 * Usage: node scripts/package.mjs
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUTPUT = path.join(DIST, 'NetworkMan');

const NODE_VERSION = '22.14.0';
const NODE_ARCH = 'win-x64';
const NODE_BASENAME = `node-v${NODE_VERSION}-${NODE_ARCH}`;
const NODE_URL = `https://nodejs.org/dist/v${NODE_VERSION}/${NODE_BASENAME}.zip`;

function run(cmd, cwd = ROOT) {
  console.log(`  > ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function step(msg) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${msg}`);
  console.log('='.repeat(60));
}

async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`  Downloading ${url}...`);
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        file.close();
        fs.unlinkSync(destPath);
        downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      const total = parseInt(response.headers['content-length'] || '0', 10);
      let downloaded = 0;
      response.on('data', (chunk) => {
        downloaded += chunk.length;
        if (total > 0) {
          const pct = Math.round((downloaded / total) * 100);
          process.stdout.write(`\r  Progress: ${pct}% (${Math.round(downloaded / 1024 / 1024)}MB)`);
        }
      });
      response.pipe(file);
      file.on('finish', () => { console.log(''); file.close(resolve); });
    }).on('error', (err) => { fs.unlinkSync(destPath); reject(err); });
  });
}

async function main() {
  // 1. Clean
  step('Cleaning previous build...');
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT, { recursive: true });

  // 2. Build all packages
  step('Building shared types...');
  run('npm run build -w packages/shared');

  step('Building server...');
  run('npm run build -w packages/server');

  step('Building client...');
  run('npm run build -w packages/client');

  // 3. Download portable Node.js
  step(`Downloading portable Node.js v${NODE_VERSION}...`);
  const nodeZipPath = path.join(DIST, 'node.zip');
  if (!fs.existsSync(nodeZipPath)) {
    await downloadFile(NODE_URL, nodeZipPath);
  }

  step('Extracting Node.js...');
  run(`powershell -Command "Expand-Archive -Path '${nodeZipPath}' -DestinationPath '${DIST}' -Force"`);

  // Copy just node.exe (we don't need npm, etc.)
  const nodeExeSrc = path.join(DIST, NODE_BASENAME, 'node.exe');
  fs.copyFileSync(nodeExeSrc, path.join(OUTPUT, 'node.exe'));

  // Clean up extracted node
  fs.rmSync(path.join(DIST, NODE_BASENAME), { recursive: true });
  fs.rmSync(nodeZipPath);

  // 4. Copy application files
  step('Copying application files...');

  // Server dist
  fs.cpSync(
    path.join(ROOT, 'packages/server/dist'),
    path.join(OUTPUT, 'app/server'),
    { recursive: true }
  );

  // Shared dist
  fs.cpSync(
    path.join(ROOT, 'packages/shared/dist'),
    path.join(OUTPUT, 'app/shared'),
    { recursive: true }
  );

  // Client dist (static files)
  fs.cpSync(
    path.join(ROOT, 'packages/client/dist'),
    path.join(OUTPUT, 'app/client-dist'),
    { recursive: true }
  );

  // 5. Copy required node_modules
  step('Copying node_modules...');
  const nmSrc = path.join(ROOT, 'node_modules');
  const nmDst = path.join(OUTPUT, 'app/node_modules');

  // Copy all node_modules (simpler and ensures nothing is missed)
  // We'll be selective by copying the production tree
  fs.mkdirSync(nmDst, { recursive: true });

  // Install production deps only in the output
  const appPkgJson = {
    name: 'networkman-portable',
    version: '1.0.0',
    type: 'module',
    dependencies: {
      express: '^5.1.0',
      'socket.io': '^4.8.0',
      'better-sqlite3': '^11.0.0',
      pino: '^9.0.0',
      'pino-pretty': '^13.0.0',
      zod: '^3.24.0',
      cors: '^2.8.5',
      ping: '^0.4.4',
      'p-limit': '^6.0.0',
      open: '^10.0.0',
    },
  };

  fs.writeFileSync(path.join(OUTPUT, 'app/package.json'), JSON.stringify(appPkgJson, null, 2));
  run('npm install --production --ignore-scripts=false', path.join(OUTPUT, 'app'));

  // Ensure better-sqlite3 prebuilds exist (may need to rebuild)
  const prebuildsPath = path.join(OUTPUT, 'app/node_modules/better-sqlite3/prebuilds');
  if (!fs.existsSync(prebuildsPath)) {
    console.log('  Rebuilding better-sqlite3 native bindings...');
    try {
      run('npx --yes prebuild-install --runtime napi --target 9', path.join(OUTPUT, 'app/node_modules/better-sqlite3'));
    } catch {
      // Copy from source if prebuild-install fails
      const srcPrebuilds = path.join(nmSrc, 'better-sqlite3/prebuilds');
      if (fs.existsSync(srcPrebuilds)) {
        fs.cpSync(srcPrebuilds, prebuildsPath, { recursive: true });
      }
    }
  }

  // 6. Create the entry point
  step('Creating entry point...');

  const entryJs = `\
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'networkman-data');
fs.mkdirSync(dataDir, { recursive: true });

const { getDatabase, closeDatabase } = await import('./server/database/connection.js');
const { migrate001 } = await import('./server/database/migrations/001-initial.js');
const { DeviceRepository } = await import('./server/database/repositories/device.repository.js');
const { AlertRepository } = await import('./server/database/repositories/alert.repository.js');
const { MetricsRepository } = await import('./server/database/repositories/metrics.repository.js');
const { ConfigRepository } = await import('./server/database/repositories/config.repository.js');
const { NetworkScannerService } = await import('./server/services/network-scanner.service.js');
const { HealthMonitorService } = await import('./server/services/health-monitor.service.js');
const { AlertEngineService } = await import('./server/services/alert-engine.service.js');
const { MetricsCollectorService } = await import('./server/services/metrics-collector.service.js');
const { createWebSocketServer } = await import('./server/websocket/ws-server.js');
const { logger } = await import('./server/utils/logger.js');

// Inline production app setup
const express = (await import('express')).default;
const cors = (await import('cors')).default;

const PORT = parseInt(process.env.PORT || '3001', 10);
const clientDist = path.join(__dirname, 'client-dist');

async function main() {
  logger.info('Starting NetworkMan...');

  const db = getDatabase(dataDir);
  migrate001(db);

  const deviceRepo = new DeviceRepository(db);
  const alertRepo = new AlertRepository(db);
  const metricsRepo = new MetricsRepository(db);
  const configRepo = new ConfigRepository(db);
  const dashConfig = configRepo.get();

  let io;

  const alertEngine = new AlertEngineService(alertRepo, (alert) => io?.emit('alert:new', alert));
  const scanner = new NetworkScannerService(
    deviceRepo,
    (progress) => io?.emit('scan:progress', progress),
    (device) => io?.emit('device:discovered', device),
  );
  const healthMonitor = new HealthMonitorService(
    deviceRepo, metricsRepo, alertEngine,
    (device) => io?.emit('device:updated', device),
    (deviceId, prev, next, device) => io?.emit('device:status-changed', { deviceId, previousStatus: prev, newStatus: next, device }),
    (metrics) => io?.emit('metrics:update', metrics),
  );
  const metricsCollector = new MetricsCollectorService(metricsRepo);

  // Express setup
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.static(clientDist));

  // Import route creators
  const { createDeviceRoutes } = await import('./server/routes/devices.routes.js');
  const { createAlertRoutes } = await import('./server/routes/alerts.routes.js');
  const { createMetricsRoutes } = await import('./server/routes/metrics.routes.js');
  const { createConfigRoutes } = await import('./server/routes/config.routes.js');
  const { createScanRoutes } = await import('./server/routes/scan.routes.js');

  app.use('/api/devices', createDeviceRoutes(deviceRepo));
  app.use('/api/alerts', createAlertRoutes(alertRepo));
  app.use('/api/metrics', createMetricsRoutes(metricsRepo));
  app.use('/api/config', createConfigRoutes(configRepo));
  app.use('/api/scan', createScanRoutes(scanner, configRepo));
  app.get('{*path}', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));

  const httpServer = createServer(app);
  io = createWebSocketServer(httpServer);

  io.on('connection', (socket) => {
    socket.on('devices:request-list', () => socket.emit('devices:list', deviceRepo.findAll()));
    socket.on('scan:trigger', async () => { const r = await scanner.scan(configRepo.get()); io.emit('scan:complete', r); });
    socket.on('alert:acknowledge', (id) => { const a = alertRepo.acknowledge(id); if (a) io.emit('alert:acknowledged', a); });
  });

  healthMonitor.start(dashConfig);
  metricsCollector.startPurgeSchedule(dashConfig.metricsRetentionDays);

  logger.info('Running initial network scan...');
  scanner.scan(dashConfig).then((r) => io.emit('scan:complete', r));

  httpServer.listen(PORT, () => {
    logger.info('NetworkMan running at http://localhost:' + PORT);
    console.log('');
    console.log('  +============================================+');
    console.log('  |  NetworkMan - Hyrule Network Monitor        |');
    console.log('  |  Dashboard: http://localhost:' + PORT + '          |');
    console.log('  |  Press Ctrl+C to stop                      |');
    console.log('  +============================================+');
    console.log('');
    import('open').then(m => m.default('http://localhost:' + PORT)).catch(() => {});
  });

  const shutdown = () => {
    healthMonitor.stop();
    metricsCollector.stop();
    closeDatabase();
    httpServer.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => { console.error('Failed to start:', err); process.exit(1); });
`;

  fs.writeFileSync(path.join(OUTPUT, 'app/entry.mjs'), entryJs);

  // 7. Create the launcher batch file
  step('Creating launcher...');

  const launcherBat = `@echo off
title NetworkMan - Hyrule Network Monitor
echo.
echo   ████████████████████████████████████████████
echo   █                                          █
echo   █   ▄▄    ▄▄                               █
echo   █   ██▀▄  ██  ▄▄▄  ▄▄▄▄▄ ▄▄  ▄▄  ▄▄▄▄   █
echo   █   ██ ▀▄ ██ █▄▄█▀  ▀█▀  ██  ██ █▀  ▀█   █
echo   █   ██  ▀███ █▄▄▄▄  ▄█▄  ▀█▄▄█▀ █    █   █
echo   █                                          █
echo   █         Hyrule Network Monitor            █
echo   █                                          █
echo   ████████████████████████████████████████████
echo.
echo   Starting server...
echo   Dashboard will open in your browser automatically.
echo   Press Ctrl+C to stop.
echo.

cd /d "%~dp0"
node.exe app\\entry.mjs

pause
`;

  fs.writeFileSync(path.join(OUTPUT, 'NetworkMan.bat'), launcherBat);

  // 8. Create a PowerShell launcher (alternative)
  const launcherPs1 = `
$Host.UI.RawUI.WindowTitle = "NetworkMan - Hyrule Network Monitor"
Set-Location $PSScriptRoot
Write-Host ""
Write-Host "  Starting NetworkMan - Hyrule Network Monitor..." -ForegroundColor Green
Write-Host "  Dashboard will open at http://localhost:3001" -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop." -ForegroundColor Yellow
Write-Host ""
& "$PSScriptRoot\\node.exe" "$PSScriptRoot\\app\\entry.mjs"
`;

  fs.writeFileSync(path.join(OUTPUT, 'NetworkMan.ps1'), launcherPs1);

  // 9. Create a README
  const readme = `NetworkMan - Hyrule Network Monitor
=====================================

QUICK START:
  Double-click NetworkMan.bat to start the dashboard.
  The browser will open automatically to http://localhost:3001

REQUIREMENTS:
  - Windows 10/11 (64-bit)
  - No installation needed! Everything is included.

NOTE:
  - A "networkman-data" folder will be created here on first run.
    This contains the SQLite database with device history.
  - The server scans your local network (192.168.1.0/24 by default).
  - You can change the subnet in the dashboard Settings.

KEYBOARD SHORTCUTS:
  Ctrl+O  - Open Ocarina Console (command menu)

TROUBLESHOOTING:
  - If the dashboard doesn't open, navigate to http://localhost:3001
  - If port 3001 is in use, set PORT=3002 before running
  - Network scanning requires the machine to have network access
`;

  fs.writeFileSync(path.join(OUTPUT, 'README.txt'), readme);

  // 10. Calculate size
  step('Build complete!');

  function dirSize(dir) {
    let total = 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) total += dirSize(p);
      else total += fs.statSync(p).size;
    }
    return total;
  }

  const totalSize = dirSize(OUTPUT);
  console.log(`\n  Output: ${OUTPUT}`);
  console.log(`  Size:   ${Math.round(totalSize / 1024 / 1024)}MB`);
  console.log(`\n  To distribute:`);
  console.log(`  1. Zip the dist/NetworkMan/ folder`);
  console.log(`  2. Send the zip to your coworker`);
  console.log(`  3. They unzip and double-click NetworkMan.bat`);
  console.log(`\n  No Node.js, Python, or any runtime installation needed!`);
}

main().catch((err) => {
  console.error('Packaging failed:', err);
  process.exit(1);
});
