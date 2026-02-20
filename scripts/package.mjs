/**
 * NetworkMan Packaging Script
 *
 * Creates a self-contained portable distribution:
 * 1. Builds all packages (shared, server, client)
 * 2. Bundles the server into a single file via esbuild
 * 3. Downloads a portable Node.js for Windows
 * 4. Creates the portable folder with launcher
 *
 * Result: dist/NetworkMan/ folder — zip it and ship it.
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
  fs.rmSync(OUTPUT, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUTPUT, 'app'), { recursive: true });

  // 2. Build all packages
  step('Building all packages...');
  run('npm run build');

  // 3. Bundle server into a single file with esbuild
  step('Bundling server with esbuild...');
  run([
    'npx esbuild packages/server/src/index.ts',
    '--bundle',
    '--platform=node',
    '--target=node20',
    '--format=esm',
    `--outfile=${path.join(OUTPUT, 'app/server-bundle.mjs').replace(/\\/g, '/')}`,
    '--external:better-sqlite3',
    '--external:ping',
    '--external:pino',
    '--external:pino-pretty',
    '--external:thread-stream',
    '--banner:js="import{createRequire}from\'module\';import{fileURLToPath as __bFU}from\'url\';import{dirname as __bDN}from\'path\';const require=createRequire(import.meta.url);const __filename=__bFU(import.meta.url);const __dirname=__bDN(__filename);"',
  ].join(' '));

  // 4. Copy client dist (static files)
  step('Copying client static files...');
  fs.cpSync(
    path.join(ROOT, 'packages/client/dist'),
    path.join(OUTPUT, 'app/client-dist'),
    { recursive: true }
  );

  // 5. Install production node_modules (only the externals + native deps)
  step('Installing production dependencies...');
  const appPkgJson = {
    name: 'networkman-portable',
    version: '1.0.0',
    type: 'module',
    dependencies: {
      'better-sqlite3': '^11.0.0',
      pino: '^9.0.0',
      'pino-pretty': '^13.0.0',
      ping: '^0.4.4',
      'thread-stream': '^3.0.0',
    },
  };

  fs.writeFileSync(path.join(OUTPUT, 'app/package.json'), JSON.stringify(appPkgJson, null, 2));
  run('npm install --production --ignore-scripts=false', path.join(OUTPUT, 'app'));

  // Ensure better-sqlite3 prebuilds exist
  const prebuildsPath = path.join(OUTPUT, 'app/node_modules/better-sqlite3/prebuilds');
  if (!fs.existsSync(prebuildsPath)) {
    console.log('  Copying better-sqlite3 prebuilds from source...');
    const srcPrebuilds = path.join(ROOT, 'node_modules/better-sqlite3/prebuilds');
    if (fs.existsSync(srcPrebuilds)) {
      fs.cpSync(srcPrebuilds, prebuildsPath, { recursive: true });
    }
  }

  // 6. Create entry point
  step('Creating entry point...');
  const entryJs = `\
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'networkman-data');
fs.mkdirSync(dataDir, { recursive: true });

process.env.NETWORKMAN_DATA_DIR = dataDir;
process.env.NETWORKMAN_CLIENT_DIST = path.join(__dirname, 'client-dist');
process.env.PORT = process.env.PORT || '3001';

await import('./server-bundle.mjs');
`;
  fs.writeFileSync(path.join(OUTPUT, 'app/entry.mjs'), entryJs);

  // 7. Download portable Node.js
  step(`Downloading portable Node.js v${NODE_VERSION}...`);
  const nodeZipPath = path.join(DIST, 'node.zip');
  if (!fs.existsSync(nodeZipPath)) {
    await downloadFile(NODE_URL, nodeZipPath);
  }

  step('Extracting Node.js...');
  run(`powershell -Command "Expand-Archive -Path '${nodeZipPath}' -DestinationPath '${DIST}' -Force"`);
  fs.copyFileSync(path.join(DIST, NODE_BASENAME, 'node.exe'), path.join(OUTPUT, 'node.exe'));
  fs.rmSync(path.join(DIST, NODE_BASENAME), { recursive: true });
  fs.rmSync(nodeZipPath);

  // 8. Create data directory
  fs.mkdirSync(path.join(OUTPUT, 'networkman-data'), { recursive: true });

  // 9. Create launchers
  step('Creating launchers...');

  fs.writeFileSync(path.join(OUTPUT, 'NetworkMan.bat'), `@echo off
title NetworkMan - Hyrule Network Monitor
echo.
echo      ^^^
echo     ^^^ ^^^    NetworkMan
echo    ^^^   ^^^   Hyrule Network Monitor
echo   ^^^ ^^^ ^^^ ^^^
echo.
echo   Starting server...
echo   Dashboard will open at: http://localhost:3001
echo   Press Ctrl+C to stop.
echo.
cd /d "%~dp0"
node.exe app\\entry.mjs
pause
`);

  // 10. Create README
  fs.writeFileSync(path.join(OUTPUT, 'README.txt'), `NetworkMan - Hyrule Network Monitor
=====================================

QUICK START:
  Double-click NetworkMan.bat to start.
  Browser opens automatically to http://localhost:3001

  Go to Config tab in the sidebar to change your network subnet.

REQUIREMENTS:
  Windows 10/11 (64-bit). No installation needed.

FILES:
  NetworkMan.bat   - Launcher (double-click to start)
  node.exe         - Bundled Node.js runtime
  app/             - Application code
  networkman-data/ - Database (created on first run)
`);

  // 11. Done
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
  console.log(`\n  Zip dist/NetworkMan/ and ship it!`);
}

main().catch((err) => {
  console.error('Packaging failed:', err);
  process.exit(1);
});
