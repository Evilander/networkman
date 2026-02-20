import type Database from 'better-sqlite3';
import { DEFAULT_CONFIG, DEFAULT_SCAN_CONFIG, type DashboardConfig } from '@networkman/shared';

export class ConfigRepository {
  constructor(private db: Database.Database) {}

  get(): DashboardConfig {
    const row = this.db.prepare('SELECT data FROM config WHERE id = 1').get() as { data: string } | undefined;
    if (!row || row.data === '{}') return { ...DEFAULT_CONFIG };

    const stored = JSON.parse(row.data) as Partial<DashboardConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...stored,
      scan: { ...DEFAULT_SCAN_CONFIG, ...(stored.scan ?? {}) },
    };
  }

  save(config: DashboardConfig): void {
    this.db.prepare('UPDATE config SET data = ? WHERE id = 1').run(JSON.stringify(config));
  }

  patch(partial: Partial<DashboardConfig>): DashboardConfig {
    const current = this.get();
    const merged: DashboardConfig = {
      ...current,
      ...partial,
      alertThresholds: {
        ...current.alertThresholds,
        ...(partial.alertThresholds ?? {}),
      },
      scan: {
        ...current.scan,
        ...(partial.scan ?? {}),
      },
    };
    this.save(merged);
    return merged;
  }
}
