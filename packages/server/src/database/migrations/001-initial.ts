import type Database from 'better-sqlite3';

export function migrate001(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ip TEXT NOT NULL UNIQUE,
      mac TEXT,
      hostname TEXT,
      status TEXT NOT NULL DEFAULT 'unknown'
        CHECK (status IN ('online', 'degraded', 'offline', 'unknown')),
      latency REAL,
      packet_loss REAL,
      last_seen TEXT,
      first_discovered TEXT NOT NULL DEFAULT (datetime('now')),
      map_position_x REAL,
      map_position_y REAL,
      map_region TEXT,
      heart_count INTEGER NOT NULL DEFAULT 10,
      tags TEXT NOT NULL DEFAULT '[]',
      is_manual INTEGER NOT NULL DEFAULT 0,
      consecutive_failures INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
    CREATE INDEX IF NOT EXISTS idx_devices_ip ON devices(ip);

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      device_id TEXT,
      type TEXT NOT NULL
        CHECK (type IN ('device_down', 'device_recovered', 'high_latency',
                        'packet_loss', 'new_device_discovered', 'threshold_breach')),
      severity TEXT NOT NULL
        CHECK (severity IN ('info', 'warning', 'critical')),
      message TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      acknowledged INTEGER NOT NULL DEFAULT 0,
      acknowledged_at TEXT,
      metadata TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_alerts_device_id ON alerts(device_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
    CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
    CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);

    CREATE TABLE IF NOT EXISTS metrics (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      latency REAL,
      packet_loss REAL NOT NULL DEFAULT 0,
      bandwidth REAL,
      ping_success_count INTEGER NOT NULL DEFAULT 0,
      ping_total_count INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_metrics_device_timestamp ON metrics(device_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp);

    CREATE TABLE IF NOT EXISTS config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL DEFAULT '{}'
    );

    INSERT OR IGNORE INTO config (id, data) VALUES (1, '{}');
  `);
}
