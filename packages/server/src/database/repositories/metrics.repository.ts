import type Database from 'better-sqlite3';
import type { NetworkMetrics, MetricsAggregated } from '@networkman/shared';

interface MetricsRow {
  id: string;
  device_id: string;
  timestamp: string;
  latency: number | null;
  packet_loss: number;
  bandwidth: number | null;
  ping_success_count: number;
  ping_total_count: number;
}

function rowToMetrics(row: MetricsRow): NetworkMetrics {
  return {
    id: row.id,
    deviceId: row.device_id,
    timestamp: row.timestamp,
    latency: row.latency,
    packetLoss: row.packet_loss,
    bandwidth: row.bandwidth,
    pingSuccessCount: row.ping_success_count,
    pingTotalCount: row.ping_total_count,
  };
}

export class MetricsRepository {
  constructor(private db: Database.Database) {}

  create(metrics: {
    id: string;
    deviceId: string;
    latency: number | null;
    packetLoss: number;
    bandwidth: number | null;
    pingSuccessCount: number;
    pingTotalCount: number;
  }): NetworkMetrics {
    this.db.prepare(`
      INSERT INTO metrics (id, device_id, latency, packet_loss, bandwidth, ping_success_count, ping_total_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      metrics.id, metrics.deviceId, metrics.latency,
      metrics.packetLoss, metrics.bandwidth,
      metrics.pingSuccessCount, metrics.pingTotalCount,
    );
    return this.findById(metrics.id)!;
  }

  createBatch(rows: Array<{
    id: string;
    deviceId: string;
    latency: number | null;
    packetLoss: number;
    bandwidth: number | null;
    pingSuccessCount: number;
    pingTotalCount: number;
  }>): void {
    const insert = this.db.prepare(`
      INSERT INTO metrics (id, device_id, latency, packet_loss, bandwidth, ping_success_count, ping_total_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const batch = this.db.transaction((items: typeof rows) => {
      for (const m of items) {
        insert.run(m.id, m.deviceId, m.latency, m.packetLoss, m.bandwidth, m.pingSuccessCount, m.pingTotalCount);
      }
    });
    batch(rows);
  }

  findById(id: string): NetworkMetrics | null {
    const row = this.db.prepare('SELECT * FROM metrics WHERE id = ?').get(id) as MetricsRow | undefined;
    return row ? rowToMetrics(row) : null;
  }

  findByDevice(deviceId: string, from: string, to: string): NetworkMetrics[] {
    const rows = this.db.prepare(
      'SELECT * FROM metrics WHERE device_id = ? AND timestamp BETWEEN ? AND ? ORDER BY timestamp'
    ).all(deviceId, from, to) as MetricsRow[];
    return rows.map(rowToMetrics);
  }

  getLatest(deviceId: string): NetworkMetrics | null {
    const row = this.db.prepare(
      'SELECT * FROM metrics WHERE device_id = ? ORDER BY timestamp DESC LIMIT 1'
    ).get(deviceId) as MetricsRow | undefined;
    return row ? rowToMetrics(row) : null;
  }

  getAggregated(deviceId: string, from: string, to: string, intervalSeconds: number = 60): MetricsAggregated[] {
    const rows = this.db.prepare(`
      SELECT
        device_id,
        strftime('%Y-%m-%dT%H:%M:', timestamp) ||
          printf('%02d', (CAST(strftime('%S', timestamp) AS INTEGER) / ?) * ?) || 'Z' as timestamp,
        AVG(latency) as avg_latency,
        MAX(latency) as max_latency,
        MIN(latency) as min_latency,
        AVG(packet_loss) as avg_packet_loss,
        AVG(bandwidth) as avg_bandwidth
      FROM metrics
      WHERE device_id = ? AND timestamp BETWEEN ? AND ?
      GROUP BY 1, 2
      ORDER BY timestamp
    `).all(intervalSeconds, intervalSeconds, deviceId, from, to) as Array<{
      device_id: string;
      timestamp: string;
      avg_latency: number | null;
      max_latency: number | null;
      min_latency: number | null;
      avg_packet_loss: number;
      avg_bandwidth: number | null;
    }>;

    return rows.map(r => ({
      deviceId: r.device_id,
      timestamp: r.timestamp,
      avgLatency: r.avg_latency,
      maxLatency: r.max_latency,
      minLatency: r.min_latency,
      avgPacketLoss: r.avg_packet_loss,
      avgBandwidth: r.avg_bandwidth,
    }));
  }

  getSummary(): { totalDevices: number; avgLatency: number | null; avgPacketLoss: number } {
    const row = this.db.prepare(`
      SELECT
        COUNT(DISTINCT device_id) as total_devices,
        AVG(latency) as avg_latency,
        AVG(packet_loss) as avg_packet_loss
      FROM metrics
      WHERE timestamp > datetime('now', '-5 minutes')
    `).get() as { total_devices: number; avg_latency: number | null; avg_packet_loss: number };
    return {
      totalDevices: row.total_devices,
      avgLatency: row.avg_latency,
      avgPacketLoss: row.avg_packet_loss ?? 0,
    };
  }

  purgeOlderThan(days: number): number {
    const result = this.db.prepare(
      `DELETE FROM metrics WHERE timestamp < datetime('now', '-' || ? || ' days')`
    ).run(days);
    return result.changes;
  }
}
