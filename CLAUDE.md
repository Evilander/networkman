# NetworkMan — CLAUDE.md

## What This Is

NetworkMan is an Ocarina of Time-themed network monitoring dashboard. It discovers devices on a LAN via ping sweep, monitors their health (latency, packet loss), and displays everything through a Zelda HUD — hearts for device health, rupees for device count, Navi fairy for alerts, Hyrule Map for topology, Gossip Stones for device info, and an Ocarina Console for command shortcuts.

It ships as a portable Windows app (zip with bundled Node.js) and also runs in dev mode from source.

## Architecture

```
packages/
├── shared/     # Types, Zod schemas, constants (consumed by both server and client)
├── server/     # Express 5 + Socket.IO 4 + better-sqlite3 (WAL mode)
└── client/     # React 19 + Vite 6 + Zustand 5
```

Monorepo with npm workspaces and TypeScript project references. The `shared` package must build first — server and client both import from `@networkman/shared`.

## Commands

```bash
npm install                # Install all workspace deps
npm run dev                # Start all three packages in watch mode (shared, server:3001, client:5173)
npm run build              # Build shared → server → client (order matters)
npm run typecheck           # Type-check all packages via tsc --build
npm run clean              # Remove all dist/ dirs
npm run package            # Build portable dist into dist/NetworkMan/ (Windows only)
```

## Key Files

| Path | Purpose |
|------|---------|
| `packages/shared/src/types/` | Device, Alert, Metrics, Config, WebSocket event types |
| `packages/shared/src/validation/schemas.ts` | Zod schemas for all API DTOs |
| `packages/shared/src/constants/defaults.ts` | Default config values (subnets, thresholds, intervals) |
| `packages/server/src/index.ts` | Server entry — wires DB, services, routes, WebSocket, starts listening |
| `packages/server/src/app.ts` | Express app factory — middleware, routes, static file serving |
| `packages/server/src/database/connection.ts` | SQLite connection (WAL mode, foreign keys, 5s busy timeout) |
| `packages/server/src/database/migrations/001-initial.ts` | Schema: devices, alerts, metrics, config tables |
| `packages/server/src/services/network-scanner.service.ts` | Ping sweep discovery with chunked concurrency |
| `packages/server/src/services/health-monitor.service.ts` | Periodic health checks, heart calculation, status transitions |
| `packages/server/src/services/alert-engine.service.ts` | Threshold evaluation, Zelda-themed alert messages |
| `packages/client/src/pages/Dashboard.tsx` | Main page — map, HUD, alerts, sidebar |
| `packages/client/src/pages/Settings.tsx` | Config UI — subnet presets, thresholds, intervals |
| `packages/client/src/hooks/useWebSocket.ts` | Socket.IO client with typed events |
| `packages/client/src/stores/` | Zustand stores: deviceStore, alertStore, metricsStore, uiStore |
| `packages/client/src/styles/theme.css` | OoT color palette (38 CSS custom properties) |
| `scripts/package.mjs` | Packaging script — esbuild bundle + portable Node.js + launcher |

## Database

SQLite via better-sqlite3 in WAL mode. Single file at `{dataDir}/networkman.db`.

**Tables:** `devices` (17 cols), `alerts` (9 cols), `metrics` (8 cols), `config` (single-row JSON blob)

Migrations are in `packages/server/src/database/migrations/`. Currently only `001-initial.ts`. Add new migrations as `002-*.ts` etc. and call them from `index.ts` after `migrate001`.

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/devices` | List all devices |
| POST | `/api/devices` | Create device manually |
| GET | `/api/devices/:id` | Get one device |
| PATCH | `/api/devices/:id` | Update device (name, tags, position) |
| DELETE | `/api/devices/:id` | Delete device |
| POST | `/api/devices/:id/ping` | Ping a specific device |
| POST | `/api/devices/:id/speedtest` | Run bandwidth test to device |
| GET | `/api/alerts` | List alerts (supports `?severity=`, `?acknowledged=`) |
| POST | `/api/alerts/acknowledge-all` | Acknowledge all alerts |
| GET | `/api/alerts/:id` | Get one alert |
| POST | `/api/alerts/:id/acknowledge` | Acknowledge one alert |
| DELETE | `/api/alerts/:id` | Delete alert |
| GET | `/api/metrics/summary` | Aggregated metrics summary |
| GET | `/api/metrics/:deviceId` | Device metrics history (`?from=`, `?to=`) |
| GET | `/api/metrics/:deviceId/latest` | Latest metrics for device |
| GET | `/api/config` | Get dashboard config |
| PATCH | `/api/config` | Partial config update |
| PUT | `/api/config` | Full config replacement |
| POST | `/api/scan` | Trigger network scan |
| GET | `/api/scan/status` | Check scan status |
| POST | `/api/scan/abort` | Abort running scan |

**Route ordering matters.** Literal paths (`/acknowledge-all`, `/:deviceId/latest`) must be registered BEFORE parameterized catch-alls (`/:id`, `/:deviceId`). Express 5 matches top-down.

## WebSocket Events

**Server → Client:** `devices:list`, `device:updated`, `device:status-changed`, `device:discovered`, `alert:new`, `alert:acknowledged`, `metrics:update`, `scan:progress`, `scan:complete`

**Client → Server:** `devices:request-list`, `scan:trigger`, `alert:acknowledge`

Events are typed via `ServerToClientEvents` / `ClientToServerEvents` in `packages/shared/src/types/websocket.ts`.

## OoT Theme Mapping

| Network Concept | OoT Element |
|---|---|
| Device health | Heart containers (10 hearts from latency + packet loss scores) |
| Device count | Rupee counter |
| Unacknowledged alerts | Skulltula counter |
| Alerts | Navi fairy with typewriter speech bubble |
| Network topology | Hyrule Map (SVG with regions, castle, river) |
| Device info | Gossip Stones |
| Network tools | Item Inventory grid |
| Command shortcuts | Ocarina Console (8 songs) |
| Loading | Spinning Triforce |
| Time of day | Day/night cycle overlay |

## Portable Build

The packaging script (`scripts/package.mjs`) uses esbuild to bundle the entire server into `server-bundle.mjs`, with only native/worker modules kept external: `better-sqlite3`, `ping`, `pino`, `pino-pretty`, `thread-stream`. The entry point (`app/entry.mjs`) sets environment variables (`NETWORKMAN_DATA_DIR`, `NETWORKMAN_CLIENT_DIST`, `PORT`) before importing the bundle.

`NetworkMan.exe` is a compiled C# launcher that starts `node.exe app/entry.mjs`, opens the browser after 4 seconds, and handles Ctrl+C. `NetworkMan.bat` is a simpler fallback.

## Conventions

- TypeScript strict mode everywhere
- CSS Modules (`.module.css`) per component — no global class collisions
- Zustand stores are flat — one store per domain (devices, alerts, metrics, UI)
- Repositories are the only code that touches the database
- Services are the only code that calls repositories (routes call services or repos)
- Pixel font: "Press Start 2P" via `<PixelText>` component — use `size="xs"|"sm"|"md"|"lg"`
- Frame borders: `<OoTFrame>` component for any dialog/panel
- All alert messages are Zelda-flavored (see alert-engine.service.ts)

## Known Issues

- `react-router-dom` is installed but unused (no client-side routing — single page)
- `@yao-pkg/pkg` is in root devDependencies but unused (replaced by esbuild bundling)
- `recharts` is installed but only used in MetricsChart — could be lazy-loaded
- CORS is set to `*` (acceptable for local network tool, not for public deployment)
- No authentication — anyone on the network can access the dashboard
- Alert engine creates duplicate alerts if a device stays in the same bad state across cycles (no deduplication window)

---

# Roadmap

Everything below is organized by priority. Each section is self-contained — pick any and run with it.

---

## Phase 1: Stability & Quality

### 1.1 — Testing Framework

There are zero tests. Set up Vitest (already compatible with the Vite toolchain) for both server and client.

**Server tests (packages/server):**
- Unit tests for `calculateHeartCount()` — it's pure math, perfect first test
- Unit tests for `getIPRange()` (subnet.ts) — edge cases: /32, /24, /16, invalid CIDR
- Unit tests for alert engine — verify correct alert types/severities for each threshold crossing
- Integration tests for each repository (use in-memory SQLite `:memory:`)
- Integration tests for REST routes (use supertest against the Express app)
- Mock `pingHost` for scanner/health tests so tests don't hit the network

**Client tests (packages/client):**
- Component tests with React Testing Library for `HeartContainer`, `RupeeCounter`, `PixelText`
- Store tests for Zustand stores — verify state transitions
- Hook tests for `useSound` (mock Audio)

**Setup:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom supertest @types/supertest
```
Add `"test": "vitest run"` and `"test:watch": "vitest"` to root package.json. Add vitest config to each package or use workspace config.

**Target: 70%+ coverage on server, 50%+ on client.**

### 1.2 — CI/CD Pipeline

Create `.github/workflows/ci.yml`:
```yaml
on: [push, pull_request]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run build
      - run: npm test
```

Add a second workflow `release.yml` that triggers on tags (`v*`):
1. Runs tests
2. Builds portable dist via `scripts/package.mjs` (needs Windows runner for native deps)
3. Creates GitHub release with zip attached
4. Eliminates the manual release process entirely

### 1.3 — Error Boundaries

The client has no React error boundaries. A single component crash takes down the whole dashboard.

- Add `<ErrorBoundary>` wrapper component in `packages/client/src/components/shared/`
- Wrap `HyruleMap`, `Sidebar`, `HUDOverlay`, and `OcarinaConsole` each in their own boundary
- Display a Gossip Stone-themed "Something went wrong" fallback with retry button
- Log errors to console with component stack trace

### 1.4 — Alert Deduplication

The alert engine currently creates a new alert every health cycle if a device stays in a bad state. After 10 minutes with 30s intervals, you get 20 identical "high latency" alerts.

Fix: Add a deduplication window. In `AlertEngineService`, track the last alert type+deviceId+severity. Don't create a new alert if the same combination was created within the last N minutes (configurable, default 10min). Store `lastAlertKey` as a Map in the service instance.

### 1.5 — Remove Unused Dependencies

- Remove `react-router-dom` from client package.json (not used)
- Remove `@yao-pkg/pkg` from root devDependencies (replaced by esbuild approach)
- Run `npm audit` and fix any vulnerabilities

---

## Phase 2: Features

### 2.1 — Device Grouping & Tagging

Devices have a `tags` field but the UI never uses it. Add:

- Tag editor in DeviceDetail panel (comma-separated input → tags array)
- Filter devices on the map by tag (dropdown in MapLegend)
- Group devices in sidebar by tag (collapsible sections)
- Color-code map markers by tag (user-assigned colors)
- Bulk tag assignment (select multiple devices on map, right-click → "Tag as...")

### 2.2 — SNMP Discovery (Device Type Detection)

Currently device type is guessed from hostname patterns. Add optional SNMP v2c/v3 queries:

- Install `net-snmp` package on server
- Query sysDescr (OID 1.3.6.1.2.1.1.1), sysName, sysObjectID on discovery
- Parse vendor/model from sysDescr (Cisco, HP, Dell, etc.)
- Store in new `device_info` JSON column (vendor, model, os, firmware)
- Show in DeviceDetail panel
- Assign more accurate OoT icons based on device type

Config: add `snmpEnabled`, `snmpCommunity`, `snmpTimeout` to DashboardConfig.

### 2.3 — Traceroute Visualization

Add a traceroute tool to the Item Inventory:

- Server endpoint: `POST /api/devices/:id/traceroute`
- Run system traceroute, parse hops (IP, latency per hop)
- Return array of `{ hop: number, ip: string, hostname: string, latency: number }`
- Client: draw the path on the Hyrule Map as a glowing trail between nodes
- Each hop gets a small marker; hovering shows latency
- Store results in metrics for historical comparison ("the route changed!")

### 2.4 — Port Scanning

Add per-device port scanning:

- Server endpoint: `POST /api/devices/:id/portscan` with body `{ ports: [80, 443, 22, ...] }`
- Use raw TCP socket connect with timeout (no nmap dependency)
- Common port presets: "Web" (80,443,8080,8443), "Admin" (22,23,3389), "Database" (3306,5432,27017)
- Store open ports in device record
- Display in DeviceDetail as an "equipment slots" UI (OoT inventory style)
- Auto-detect device type from open ports (80+443 = web server, 22 = Linux, 3389 = Windows)

### 2.5 — Bandwidth Monitoring (Real Throughput)

The rupee counter currently shows device count. Make it show actual bandwidth:

- Use SNMP ifInOctets/ifOutOctets polling for managed switches/routers (if SNMP enabled)
- For non-SNMP devices, use the existing speedtest endpoint (iperf3-style TCP throughput test)
- Store bandwidth in metrics table (the `bandwidth` column exists but is always null)
- Rupee color mapping: Green < 100Mbps, Blue < 500Mbps, Red >= 500Mbps, Gold >= 1Gbps
- Add bandwidth sparkline to DeviceDetail
- Add aggregate bandwidth display to HUD

### 2.6 — Wake-on-LAN

Add WoL to the Item Inventory as "Din's Fire" (wake a sleeping device):

- Requires MAC address (already in device schema, but currently always null)
- Capture MAC via ARP table during scan: `arp -a` parsing
- Server endpoint: `POST /api/devices/:id/wake`
- Send magic packet (UDP broadcast to port 9, 6x FF + 16x MAC)
- No external dependency needed — raw UDP socket

### 2.7 — Uptime Tracking & SLA Dashboard

Track device uptime percentage over time:

- Calculate from metrics history: `uptime = online_checks / total_checks * 100`
- New API endpoint: `GET /api/devices/:id/uptime?period=24h|7d|30d`
- Display as a "Piece of Heart" completion meter in DeviceDetail (4 quarters = 100%)
- SLA dashboard page: table of all devices with 24h/7d/30d uptime columns
- Alert when uptime drops below configurable threshold (e.g., 99.9%)

### 2.8 — Notification Integrations

Navi alerts are great on the dashboard, but useless if you're not looking at it.

- **Email alerts**: SMTP config in settings, send on critical alerts
- **Webhook/Discord**: POST JSON payload to a configurable URL
- **System tray notification**: For portable mode, use `node-notifier` to show OS toast notifications
- Config UI: notification channel settings with test button

### 2.9 — Multi-Subnet Map Regions

The Hyrule Map currently places all devices in one flat space. Map subnets to Zelda regions:

- Each configured subnet maps to a named region on the map
- Region boundaries are drawn as distinct areas (Kokiri Forest = 192.168.1.x, Death Mountain = 10.0.0.x)
- Devices auto-place within their region
- Zooming into a region shows only that subnet's devices
- Region health summary: aggregate hearts for all devices in region

---

## Phase 3: Performance & Scale

### 3.1 — Database Optimizations

- Add composite index: `CREATE INDEX idx_metrics_device_recent ON metrics(device_id, timestamp DESC)`
- Implement metrics downsampling: after 7 days, aggregate per-hour; after 30 days, aggregate per-day
- Use SQLite `PRAGMA journal_size_limit` to cap WAL file size
- Add `VACUUM` on a weekly schedule
- Benchmark with 500+ devices and 1M+ metrics rows, optimize slow queries

### 3.2 — Frontend Performance

- Virtualize the device list in sidebar (only render visible items) — use `@tanstack/react-virtual`
- Memoize `MapDevice` components with `React.memo` — they re-render on every device update even if their own data hasn't changed
- Lazy-load `OcarinaConsole`, `HelpModal`, `MetricsChart` with `React.lazy` + `Suspense`
- Debounce map drag/zoom events (currently fires on every mouse move)
- Use `requestAnimationFrame` for map device position updates during drag

### 3.3 — Scan Performance for Large Networks

- `/16` networks (65K hosts) take 5-8 minutes. Improve:
- Use raw ICMP sockets instead of spawning `ping` processes (via `raw-socket` or `net-ping`)
- Implement ARP scanning for local subnet (instant discovery, no ICMP needed)
- Cache negative results — don't re-ping IPs that were offline in the last scan for 3 cycles
- Parallel DNS resolution (currently sequential after discovery)

### 3.4 — API Pagination

- Alert history endpoint returns all alerts. Add `?page=1&limit=50` pagination.
- Device list should support `?status=online&sort=name&limit=100`
- Metrics queries should support `?resolution=1m|5m|1h|1d` for downsampled data

---

## Phase 4: Polish & UX

### 4.1 — Responsive Design

The dashboard is fixed-width and doesn't work on tablets or phones. Add:

- Breakpoints at 768px (tablet) and 480px (phone)
- Collapsible sidebar on mobile (hamburger menu)
- Map scales to fit viewport
- HUD repositions to bottom on mobile
- Touch support for map drag/zoom (pinch-to-zoom)

### 4.2 — Accessibility

- Add `aria-label` to all interactive elements (buttons, inputs, map markers)
- Add `role="status"` to live-updating elements (device count, alert count)
- Keyboard navigation for map devices (arrow keys to move between markers, Enter to select)
- High-contrast mode toggle (replace pixel art gradients with solid high-contrast colors)
- Screen reader descriptions for heart containers ("Device health: 7 out of 10 hearts")
- Reduce motion mode (disable Navi bob, heart pulse, etc.)

### 4.3 — Sound System Improvements

- Volume slider (currently just on/off toggle)
- Per-sound-category toggles (alerts, UI clicks, ambient)
- Add ambient Hyrule Field music (looping, low volume, toggleable)
- Ocarina note sounds when typing songs in the console
- "Low health" beeping when any device drops below 3 hearts (like the game)
- Preload all audio on first user interaction to avoid playback delays

### 4.4 — Dark Mode / Theme Variants

The OoT theme is dark by default, but add variants:

- **Dawn theme** (warm gold tones — matches the day/night cycle dawn period)
- **Light World** (bright Zelda theme for daytime use)
- **Dark World** (A Link to the Past purple/dark — for OLED displays)
- **Minimal** (strip OoT elements, plain professional look for screenshots/presentations)
- Theme selector in Settings, persisted to config

### 4.5 — Map Improvements

- **Mini-map in HUD** — small overview of entire map in corner, click to navigate
- **Device connection lines** — draw lines between related devices (gateway → all its clients)
- **Drag to reposition devices** — currently auto-placed; let users drag markers to custom positions
- **Map export** — save map as PNG/SVG for documentation
- **Custom background** — upload a floor plan image to replace the Hyrule Map SVG
- **Zoom to device** — clicking a device in sidebar centers + zooms the map to it

### 4.6 — Dashboard Customization

- **Widget system** — let users arrange dashboard panels (map, alerts, metrics, inventory)
- **Pinned devices** — star important devices, show them in HUD
- **Custom Navi messages** — let users write custom alert templates
- **Export/import config** — backup and restore dashboard settings as JSON

---

## Phase 5: Platform & Deployment

### 5.1 — Docker Support

Create `Dockerfile` and `docker-compose.yml`:

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["node", "packages/server/dist/index.js"]
```

Docker Compose for easy deployment:
```yaml
services:
  networkman:
    build: .
    ports: ["3001:3001"]
    volumes: ["./data:/app/data"]
    network_mode: host  # Required for LAN scanning
    restart: unless-stopped
```

### 5.2 — Linux / macOS Portable Builds

Currently only Windows has a portable build. Extend `scripts/package.mjs`:

- Detect platform or accept `--platform=linux|darwin|win32` flag
- Download correct Node.js binary (linux-x64, darwin-arm64, etc.)
- Create shell script launcher (`NetworkMan.sh`) for Unix
- Handle `better-sqlite3` native bindings per platform
- GitHub Actions matrix build: produce zips for all 3 platforms

### 5.3 — Electron Wrapper (Optional)

For a "real" desktop app experience:

- Wrap the existing Express server + React client in Electron
- System tray icon with quick status (green/yellow/red based on worst device)
- Native notifications via Electron's Notification API
- Auto-start on login option
- Single `.exe` installer via electron-builder
- Note: this is heavyweight (~150MB) vs the current portable approach (~40MB). Only pursue if users demand a native feel.

### 5.4 — Multi-User Support

Currently single-user, no auth. For team use:

- Add simple auth (username/password stored in config, bcrypt hashed)
- Session management via JWT or express-session
- Role-based access: admin (full control) vs viewer (read-only)
- Audit log: who acknowledged which alert, who changed config
- Per-user dashboard preferences (layout, theme, sound)

### 5.5 — REST API Documentation

- Generate OpenAPI 3.0 spec from route definitions
- Serve Swagger UI at `/api/docs` (dev mode only)
- Or: manually write a clean API reference in `docs/api.md`

---

## Phase 6: Advanced Monitoring

### 6.1 — SNMP Trap Receiver

Don't just poll — listen for events:

- Run an SNMP trap listener on UDP port 162
- Parse incoming traps (linkDown, linkUp, etc.)
- Create alerts from traps in real-time (faster than polling)
- Display trap source as Gossip Stone messages

### 6.2 — NetFlow / sFlow Collection

For deep traffic analysis (requires managed network equipment):

- Lightweight NetFlow v5/v9 collector
- Parse flow records: source IP, dest IP, bytes, protocol
- Top talkers dashboard (which devices generate the most traffic)
- Traffic matrix visualization (who talks to whom)
- Store aggregated flow data in SQLite

### 6.3 — Service Monitoring

Go beyond ping — check if services are actually working:

- HTTP(S) endpoint checks (GET URL, verify status code + response time)
- TCP port checks (connect and optionally send/expect strings)
- DNS resolution checks (query a domain, verify answer)
- Certificate expiry monitoring (alert N days before TLS cert expires)
- Config UI: per-device service check list
- Display as "quest items" in the device's inventory

### 6.4 — Anomaly Detection

Use historical metrics to detect unusual patterns:

- Calculate rolling baselines per device (avg latency over last 7 days by hour-of-day)
- Alert when current metrics deviate >2 standard deviations from baseline
- "Something feels wrong in the Lost Woods..." alert for subtle degradation
- Trend analysis: "latency has been increasing 5% per week for the last month"

### 6.5 — Network Topology Auto-Discovery

Automatically build the network topology:

- Parse ARP tables to find MAC addresses and map IP→MAC
- Query LLDP/CDP data via SNMP from managed switches
- Identify which switch port each device is connected to
- Auto-draw connection lines on the Hyrule Map
- Detect gateway/router devices and place them as "temples" on the map
