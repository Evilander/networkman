import type Database from 'better-sqlite3';
import type { Device, DeviceCreateInput, DeviceUpdateInput, DeviceStatus } from '@networkman/shared';

interface DeviceRow {
  id: string;
  name: string;
  ip: string;
  mac: string | null;
  hostname: string | null;
  status: string;
  latency: number | null;
  packet_loss: number | null;
  last_seen: string | null;
  first_discovered: string;
  map_position_x: number | null;
  map_position_y: number | null;
  map_region: string | null;
  heart_count: number;
  tags: string;
  is_manual: number;
  consecutive_failures: number;
}

function rowToDevice(row: DeviceRow): Device {
  return {
    id: row.id,
    name: row.name,
    ip: row.ip,
    mac: row.mac,
    hostname: row.hostname,
    status: row.status as DeviceStatus,
    latency: row.latency,
    packetLoss: row.packet_loss,
    lastSeen: row.last_seen,
    firstDiscovered: row.first_discovered,
    mapPosition: row.map_position_x !== null ? {
      x: row.map_position_x,
      y: row.map_position_y!,
      region: row.map_region ?? undefined,
    } : null,
    heartCount: row.heart_count,
    tags: JSON.parse(row.tags),
    isManual: row.is_manual === 1,
  };
}

export class DeviceRepository {
  constructor(private db: Database.Database) {}

  findAll(status?: DeviceStatus): Device[] {
    let sql = 'SELECT * FROM devices';
    const params: unknown[] = [];
    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    sql += ' ORDER BY name';
    const rows = this.db.prepare(sql).all(...params) as DeviceRow[];
    return rows.map(rowToDevice);
  }

  findById(id: string): Device | null {
    const row = this.db.prepare('SELECT * FROM devices WHERE id = ?').get(id) as DeviceRow | undefined;
    return row ? rowToDevice(row) : null;
  }

  findByIp(ip: string): Device | null {
    const row = this.db.prepare('SELECT * FROM devices WHERE ip = ?').get(ip) as DeviceRow | undefined;
    return row ? rowToDevice(row) : null;
  }

  create(id: string, input: DeviceCreateInput): Device {
    this.db.prepare(`
      INSERT INTO devices (id, name, ip, mac, hostname, map_position_x, map_position_y, map_region, tags, is_manual)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.name,
      input.ip,
      input.mac ?? null,
      input.hostname ?? null,
      input.mapPosition?.x ?? null,
      input.mapPosition?.y ?? null,
      input.mapPosition?.region ?? null,
      JSON.stringify(input.tags ?? []),
      1,
    );
    return this.findById(id)!;
  }

  upsertDiscovered(id: string, ip: string, hostname: string | null): Device {
    const existing = this.findByIp(ip);
    if (existing) return existing;

    const name = hostname || ip;
    this.db.prepare(`
      INSERT INTO devices (id, name, ip, hostname, is_manual)
      VALUES (?, ?, ?, ?, 0)
    `).run(id, name, ip, hostname);
    return this.findById(id)!;
  }

  update(id: string, input: DeviceUpdateInput): Device | null {
    const sets: string[] = [];
    const params: unknown[] = [];

    if (input.name !== undefined) { sets.push('name = ?'); params.push(input.name); }
    if (input.mapPosition !== undefined) {
      sets.push('map_position_x = ?, map_position_y = ?, map_region = ?');
      params.push(input.mapPosition?.x ?? null, input.mapPosition?.y ?? null, input.mapPosition?.region ?? null);
    }
    if (input.tags !== undefined) { sets.push('tags = ?'); params.push(JSON.stringify(input.tags)); }
    if (input.isManual !== undefined) { sets.push('is_manual = ?'); params.push(input.isManual ? 1 : 0); }

    if (sets.length === 0) return this.findById(id);

    sets.push("updated_at = datetime('now')");
    params.push(id);
    this.db.prepare(`UPDATE devices SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  }

  updateHealth(
    id: string,
    status: DeviceStatus,
    latency: number | null,
    packetLoss: number | null,
    heartCount: number,
    consecutiveFailures: number,
  ): void {
    this.db.prepare(`
      UPDATE devices SET
        status = ?, latency = ?, packet_loss = ?, heart_count = ?,
        consecutive_failures = ?,
        last_seen = CASE WHEN ? IN ('online', 'degraded') THEN datetime('now') ELSE last_seen END,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(status, latency, packetLoss, heartCount, consecutiveFailures, status, id);
  }

  delete(id: string): boolean {
    const result = this.db.prepare('DELETE FROM devices WHERE id = ?').run(id);
    return result.changes > 0;
  }

  getConsecutiveFailures(id: string): number {
    const row = this.db.prepare('SELECT consecutive_failures FROM devices WHERE id = ?').get(id) as { consecutive_failures: number } | undefined;
    return row?.consecutive_failures ?? 0;
  }
}
