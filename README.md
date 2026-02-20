
```
        ▲
       ▲ ▲      THE LEGEND OF ZELDA
      ▲   ▲
     ▲ ▲ ▲ ▲    N E T W O R K   M A N A G E R
```

# NetworkMan

> *"Hey! Listen!"* — A Legend of Zelda: Ocarina of Time themed network monitoring dashboard.

NetworkMan transforms boring network monitoring into an adventure through Hyrule. Discover devices on your network, monitor their health with heart containers, receive alerts from Navi, and manage everything from the Hyrule Field map.

---

## Features

### **Heart Containers** — Device Health
Each device gets 10 hearts based on latency and packet loss. Watch them drain in real-time when things go wrong.
- Full hearts = healthy device
- Half hearts = degraded performance
- Empty hearts = trouble in Hyrule
- Critical health triggers the classic low-health blinking warning

### **Hyrule Field Map** — Network Topology
Your network devices appear as markers on the Hyrule overworld map, complete with:
- Kokiri Forest, Death Mountain, Lake Hylia, Gerudo Valley regions
- SVG map decorations (castle, river, trees, mountains)
- Day/night cycle based on real wall-clock time
- Click any device marker to see details, latency charts, and health

### **Navi Alerts** — Real-Time Notifications
*"Hey! Listen! Server-03 is down!"*
- Navi fairy appears with speech bubble alerts
- Typewriter text effect like the original game
- Critical alerts get the urgent Navi animation
- Alert queue with badge counter

### **Rupee Counter** — Device Count
- Green rupees: < 100 devices
- Blue rupees: < 500 devices
- Red rupees: 500+ devices
- Animated counting animation when values change

### **Ocarina of Network** — Command Console
Play songs to trigger network actions (Ctrl+O):

| Song | Notes | Action |
|---|---|---|
| Zelda's Lullaby | `< ^ > < ^ >` | Full network scan |
| Saria's Song | `v > < v > <` | Refresh all devices |
| Song of Storms | `A v ^ A v ^` | Clear all alerts |
| Song of Time | `> A v > A v` | View metrics summary |
| Epona's Song | `^ < > ^ < >` | Export device list |
| Sun's Song | `> v ^ > v ^` | Toggle sound on/off |
| Minuet of Forest | `A ^ < > < >` | Show healthy devices |
| Prelude of Light | `^ > ^ > < ^` | Ping all offline devices |

### **Gold Skulltula Counter** — Issue Tracker
Unacknowledged alerts show as Gold Skulltula tokens in the sidebar.

### **Item Inventory** — Network Tools
OoT pause-screen style grid with quick tools: Scan, Refresh, Dismiss Alerts, Summary.

### **"You Got an Item!"** — Discovery Notifications
When new devices are found, get the classic item-get animation and fanfare.

### **Title Screen**
Full OoT-style boot screen with Triforce animation and twinkling starfield.

---

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite 6 |
| Backend | Node.js + Express 5 + Socket.IO 4 |
| Database | SQLite (better-sqlite3, WAL mode) |
| State | Zustand 5 |
| Charts | Recharts |
| Monorepo | npm workspaces + TypeScript project references |
| Font | Press Start 2P (pixel font) |

---

## Quick Start

### Standalone Executable (Windows)

Download `NetworkMan.zip` from the [Releases](../../releases) page. No Node.js or Python required.

1. Extract the zip
2. Double-click `NetworkMan.bat`
3. Browser opens automatically to `http://localhost:3001`
4. Go to Settings to configure your subnet (default: `192.168.1.0/24`)

### Development Mode

```bash
# Clone the repo
git clone https://github.com/Evilander/networkman.git
cd networkman

# Install dependencies
npm install

# Build shared types
npm run build -w packages/shared

# Start dev mode (server + client with hot reload)
npm run dev
```

- Server: `http://localhost:3001`
- Client: `http://localhost:5173` (proxies API to server)

### Build for Production

```bash
npm run build
npm run package    # Creates dist/NetworkMan/ portable distribution
```

---

## Configuration

Open the Settings page in the dashboard or use the REST API:

```bash
# Update subnet to scan
curl -X PATCH http://localhost:3001/api/config \
  -H "Content-Type: application/json" \
  -d '{"subnets":[{"cidr":"10.0.0.0/24","label":"My LAN","enabled":true}]}'

# Trigger a scan
curl -X POST http://localhost:3001/api/scan
```

### Scan Settings (for large networks)

| Setting | Default | Description |
|---|---|---|
| `maxConcurrentScanPings` | 200 | Parallel pings during scan |
| `scanPingTimeoutMs` | 1500 | Timeout per ping (ms) |
| `scanPingsPerHost` | 1 | Pings per host for discovery |
| `scanChunkSize` | 512 | Hosts processed per batch |

A /24 subnet (254 hosts) scans in ~5-10 seconds. A /16 (65K hosts) takes ~5-8 minutes.

---

## REST API

| Endpoint | Method | Description |
|---|---|---|
| `/api/devices` | GET | List all devices |
| `/api/devices/:id` | PATCH | Update device (name, tags, position) |
| `/api/devices/:id/ping` | POST | Ping a specific device |
| `/api/alerts` | GET | List all alerts |
| `/api/alerts/acknowledge-all` | POST | Acknowledge all alerts |
| `/api/metrics/:deviceId` | GET | Get device metrics history |
| `/api/metrics/summary` | GET | Network-wide metrics summary |
| `/api/config` | GET/PATCH | Dashboard configuration |
| `/api/scan` | POST | Trigger network scan |
| `/api/scan/status` | GET | Check if scan is running |
| `/api/scan/abort` | POST | Abort running scan |

---

## WebSocket Events

Real-time updates via Socket.IO:

**Server to Client:** `devices:list`, `device:updated`, `device:status-changed`, `device:discovered`, `alert:new`, `alert:acknowledged`, `metrics:update`, `scan:progress`, `scan:complete`

**Client to Server:** `devices:request-list`, `scan:trigger`, `alert:acknowledge`, `metrics:subscribe`, `metrics:unsubscribe`

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Ctrl+O` | Open Ocarina Console |

---

## Project Structure

```
networkman/
├── packages/
│   ├── shared/          # Types, constants, Zod validation schemas
│   ├── server/          # Express + Socket.IO + SQLite backend
│   │   └── src/
│   │       ├── services/    # Scanner, Health Monitor, Alert Engine, Metrics
│   │       ├── routes/      # REST API endpoints
│   │       ├── database/    # SQLite repos + migrations
│   │       └── websocket/   # Socket.IO typed server
│   └── client/          # React + Vite frontend
│       └── src/
│           ├── components/  # OoT-themed UI components
│           ├── stores/      # Zustand state management
│           ├── hooks/       # WebSocket, sound, day/night cycle
│           └── styles/      # Theme, animations, global CSS
└── scripts/
    └── package.mjs      # Portable distribution builder
```

---

## How Health is Calculated

Each device gets a health score from 0-10 hearts:

- **5 hearts from latency**: < 50ms = 5, < 100ms = 4, < 200ms = 3, < 500ms = 2, < 1000ms = 1, else 0
- **5 hearts from packet loss**: 0% = 5, < 5% = 4, < 10% = 3, < 25% = 2, < 50% = 1, else 0
- **Total**: Sum of both scores

Status thresholds:
- **Online**: Responding to pings
- **Degraded**: High latency or packet loss (configurable thresholds)
- **Offline**: Failed consecutive ping checks (default: 3 failures)

---

*Built with the courage of Link, the wisdom of Zelda, and the power of Node.js.*
