import type Database from 'better-sqlite3';
import type { Alert, AlertType, AlertSeverity } from '@networkman/shared';

interface AlertRow {
  id: string;
  device_id: string | null;
  type: string;
  severity: string;
  message: string;
  timestamp: string;
  acknowledged: number;
  acknowledged_at: string | null;
  metadata: string;
}

function rowToAlert(row: AlertRow): Alert {
  return {
    id: row.id,
    deviceId: row.device_id,
    type: row.type as AlertType,
    severity: row.severity as AlertSeverity,
    message: row.message,
    timestamp: row.timestamp,
    acknowledged: row.acknowledged === 1,
    acknowledgedAt: row.acknowledged_at,
    metadata: JSON.parse(row.metadata),
  };
}

export class AlertRepository {
  constructor(private db: Database.Database) {}

  findAll(opts: {
    severity?: AlertSeverity;
    acknowledged?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Alert[] {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (opts.severity) { conditions.push('severity = ?'); params.push(opts.severity); }
    if (opts.acknowledged !== undefined) { conditions.push('acknowledged = ?'); params.push(opts.acknowledged ? 1 : 0); }

    let sql = 'SELECT * FROM alerts';
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY timestamp DESC';
    if (opts.limit) { sql += ' LIMIT ?'; params.push(opts.limit); }
    if (opts.offset) { sql += ' OFFSET ?'; params.push(opts.offset); }

    return (this.db.prepare(sql).all(...params) as AlertRow[]).map(rowToAlert);
  }

  findById(id: string): Alert | null {
    const row = this.db.prepare('SELECT * FROM alerts WHERE id = ?').get(id) as AlertRow | undefined;
    return row ? rowToAlert(row) : null;
  }

  create(alert: {
    id: string;
    deviceId: string | null;
    type: AlertType;
    severity: AlertSeverity;
    message: string;
    metadata?: Record<string, unknown>;
  }): Alert {
    this.db.prepare(`
      INSERT INTO alerts (id, device_id, type, severity, message, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      alert.id,
      alert.deviceId,
      alert.type,
      alert.severity,
      alert.message,
      JSON.stringify(alert.metadata ?? {}),
    );
    return this.findById(alert.id)!;
  }

  acknowledge(id: string): Alert | null {
    this.db.prepare(`
      UPDATE alerts SET acknowledged = 1, acknowledged_at = datetime('now') WHERE id = ?
    `).run(id);
    return this.findById(id);
  }

  acknowledgeAll(): number {
    const result = this.db.prepare(`
      UPDATE alerts SET acknowledged = 1, acknowledged_at = datetime('now') WHERE acknowledged = 0
    `).run();
    return result.changes;
  }

  delete(id: string): boolean {
    return this.db.prepare('DELETE FROM alerts WHERE id = ?').run(id).changes > 0;
  }

  getUnacknowledgedCount(): number {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM alerts WHERE acknowledged = 0').get() as { count: number };
    return row.count;
  }
}
