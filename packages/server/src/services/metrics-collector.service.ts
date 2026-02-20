import { MetricsRepository } from '../database/repositories/metrics.repository.js';
import { logger } from '../utils/logger.js';

export class MetricsCollectorService {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private metricsRepo: MetricsRepository) {}

  startPurgeSchedule(retentionDays: number): void {
    this.stop();
    // Purge old metrics every hour
    this.timer = setInterval(() => {
      const purged = this.metricsRepo.purgeOlderThan(retentionDays);
      if (purged > 0) {
        logger.info(`Purged ${purged} old metric records`);
      }
    }, 60 * 60 * 1000);

    // Also purge on startup
    const purged = this.metricsRepo.purgeOlderThan(retentionDays);
    if (purged > 0) {
      logger.info(`Startup purge: ${purged} old metric records removed`);
    }
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
