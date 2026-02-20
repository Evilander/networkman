import crypto from 'node:crypto';
import type { Alert, AlertThresholds, Device, DeviceStatus } from '@networkman/shared';
import { AlertRepository } from '../database/repositories/alert.repository.js';
import { logger } from '../utils/logger.js';

export class AlertEngineService {
  constructor(
    private alertRepo: AlertRepository,
    private onAlert?: (alert: Alert) => void,
  ) {}

  evaluate(
    device: Device,
    previousStatus: DeviceStatus,
    newStatus: DeviceStatus,
    latency: number | null,
    packetLoss: number,
    thresholds: AlertThresholds,
  ): void {
    // Device went down
    if (newStatus === 'offline' && previousStatus !== 'offline') {
      const alert = this.alertRepo.create({
        id: crypto.randomUUID(),
        deviceId: device.id,
        type: 'device_down',
        severity: 'critical',
        message: `Hey! Listen! ${device.name} is down!`,
        metadata: { ip: device.ip, previousStatus },
      });
      logger.warn(`ALERT: ${alert.message}`);
      this.onAlert?.(alert);
    }

    // Device recovered
    if (newStatus === 'online' && previousStatus === 'offline') {
      const alert = this.alertRepo.create({
        id: crypto.randomUUID(),
        deviceId: device.id,
        type: 'device_recovered',
        severity: 'info',
        message: `${device.name} has recovered! The fairy's blessing worked!`,
        metadata: { ip: device.ip },
      });
      logger.info(`ALERT: ${alert.message}`);
      this.onAlert?.(alert);
    }

    // High latency
    if (latency !== null && latency >= thresholds.latencyCriticalMs && newStatus !== 'offline') {
      const alert = this.alertRepo.create({
        id: crypto.randomUUID(),
        deviceId: device.id,
        type: 'high_latency',
        severity: 'critical',
        message: `Watch out! ${device.name} latency is ${Math.round(latency)}ms — like trudging through the Lost Woods!`,
        metadata: { latency, threshold: thresholds.latencyCriticalMs },
      });
      this.onAlert?.(alert);
    } else if (latency !== null && latency >= thresholds.latencyWarningMs && newStatus !== 'offline') {
      const alert = this.alertRepo.create({
        id: crypto.randomUUID(),
        deviceId: device.id,
        type: 'high_latency',
        severity: 'warning',
        message: `${device.name} latency rising: ${Math.round(latency)}ms — the path grows treacherous...`,
        metadata: { latency, threshold: thresholds.latencyWarningMs },
      });
      this.onAlert?.(alert);
    }

    // Packet loss
    if (packetLoss >= thresholds.packetLossCriticalPct && newStatus !== 'offline') {
      const alert = this.alertRepo.create({
        id: crypto.randomUUID(),
        deviceId: device.id,
        type: 'packet_loss',
        severity: 'critical',
        message: `${device.name} is losing ${packetLoss}% of packets — like rupees slipping through your fingers!`,
        metadata: { packetLoss, threshold: thresholds.packetLossCriticalPct },
      });
      this.onAlert?.(alert);
    } else if (packetLoss >= thresholds.packetLossWarningPct && newStatus !== 'offline') {
      const alert = this.alertRepo.create({
        id: crypto.randomUUID(),
        deviceId: device.id,
        type: 'packet_loss',
        severity: 'warning',
        message: `${device.name} packet loss: ${packetLoss}% — some items are going missing...`,
        metadata: { packetLoss, threshold: thresholds.packetLossWarningPct },
      });
      this.onAlert?.(alert);
    }
  }
}
