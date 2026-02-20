import crypto from 'node:crypto';
import pLimit from 'p-limit';
import type { DashboardConfig, Device, DeviceStatus, NetworkMetrics } from '@networkman/shared';
import { DeviceRepository } from '../database/repositories/device.repository.js';
import { MetricsRepository } from '../database/repositories/metrics.repository.js';
import { AlertEngineService } from './alert-engine.service.js';
import { pingHost } from '../utils/ping.js';
import { logger } from '../utils/logger.js';

export function calculateHeartCount(
  latency: number | null,
  packetLoss: number,
  isAlive: boolean,
  thresholds: { latencyWarningMs: number; latencyCriticalMs: number; packetLossWarningPct: number; packetLossCriticalPct: number }
): number {
  if (!isAlive) return 0;

  let latencyHearts = 5;
  if (latency !== null) {
    if (latency >= thresholds.latencyCriticalMs) {
      latencyHearts = 1;
    } else if (latency >= thresholds.latencyWarningMs) {
      const ratio = (latency - thresholds.latencyWarningMs) / (thresholds.latencyCriticalMs - thresholds.latencyWarningMs);
      latencyHearts = Math.max(1, Math.round(5 - ratio * 4));
    }
  }

  let lossHearts = 5;
  if (packetLoss >= thresholds.packetLossCriticalPct) {
    lossHearts = 1;
  } else if (packetLoss >= thresholds.packetLossWarningPct) {
    const ratio = (packetLoss - thresholds.packetLossWarningPct) / (thresholds.packetLossCriticalPct - thresholds.packetLossWarningPct);
    lossHearts = Math.max(1, Math.round(5 - ratio * 4));
  }

  return Math.max(1, latencyHearts + lossHearts);
}

export class HealthMonitorService {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private deviceRepo: DeviceRepository,
    private metricsRepo: MetricsRepository,
    private alertEngine: AlertEngineService,
    private onDeviceUpdated?: (device: Device) => void,
    private onStatusChanged?: (deviceId: string, prev: DeviceStatus, next: DeviceStatus, device: Device) => void,
    private onMetrics?: (metrics: NetworkMetrics[]) => void,
  ) {}

  start(config: DashboardConfig): void {
    this.stop();
    logger.info(`Health monitor starting (interval: ${config.healthCheckIntervalSeconds}s)`);

    // Run immediately, then on interval
    this.runCycle(config);
    this.timer = setInterval(() => this.runCycle(config), config.healthCheckIntervalSeconds * 1000);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async runCycle(config: DashboardConfig): Promise<void> {
    const devices = this.deviceRepo.findAll();
    if (devices.length === 0) return;

    const limit = pLimit(config.maxConcurrentPings);
    const metricsBuffer: NetworkMetrics[] = [];

    const tasks = devices.map(device =>
      limit(async () => {
        const previousStatus = device.status;
        const result = await pingHost(device.ip, config.pingTimeoutMs, config.pingsPerCheck);

        const latency = result.time;
        const packetLoss = result.packetLoss;
        const alive = result.alive;

        // Determine new status
        let newStatus: DeviceStatus;
        const failures = this.deviceRepo.getConsecutiveFailures(device.id);

        if (alive && packetLoss < config.alertThresholds.packetLossWarningPct &&
            (latency === null || latency < config.alertThresholds.latencyWarningMs)) {
          newStatus = 'online';
        } else if (alive) {
          newStatus = 'degraded';
        } else {
          const newFailures = failures + 1;
          if (newFailures >= config.alertThresholds.offlineAfterFailedPings) {
            newStatus = 'offline';
          } else {
            newStatus = previousStatus === 'unknown' ? 'unknown' : previousStatus;
          }
        }

        const heartCount = calculateHeartCount(latency, packetLoss, alive, config.alertThresholds);
        const consecutiveFailures = alive ? 0 : failures + 1;

        this.deviceRepo.updateHealth(device.id, newStatus, latency, packetLoss, heartCount, consecutiveFailures);

        // Store metrics
        const metricsId = crypto.randomUUID();
        const pingSuccess = Math.round(config.pingsPerCheck * (1 - packetLoss / 100));
        this.metricsRepo.create({
          id: metricsId,
          deviceId: device.id,
          latency,
          packetLoss,
          bandwidth: null,
          pingSuccessCount: pingSuccess,
          pingTotalCount: config.pingsPerCheck,
        });

        const storedMetrics = this.metricsRepo.findById(metricsId);
        if (storedMetrics) metricsBuffer.push(storedMetrics);

        // Check alerts
        const updatedDevice = this.deviceRepo.findById(device.id)!;
        this.alertEngine.evaluate(updatedDevice, previousStatus, newStatus, latency, packetLoss, config.alertThresholds);

        // Emit updates
        this.onDeviceUpdated?.(updatedDevice);
        if (previousStatus !== newStatus) {
          this.onStatusChanged?.(device.id, previousStatus, newStatus, updatedDevice);
        }
      })
    );

    await Promise.allSettled(tasks);

    if (metricsBuffer.length > 0) {
      this.onMetrics?.(metricsBuffer);
    }
  }
}
