import type { AlertThresholds, DashboardConfig, ScanConfig } from '../types/config.js';

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  latencyWarningMs: 100,
  latencyCriticalMs: 500,
  packetLossWarningPct: 5,
  packetLossCriticalPct: 25,
  offlineAfterFailedPings: 3,
};

export const DEFAULT_SCAN_CONFIG: ScanConfig = {
  maxConcurrentScanPings: 200,
  scanPingTimeoutMs: 1500,
  scanPingsPerHost: 1,
  scanChunkSize: 512,
};

export const DEFAULT_CONFIG: DashboardConfig = {
  subnets: [{ cidr: '192.168.1.0/24', label: 'Default LAN', enabled: true }],
  scanIntervalSeconds: 600,
  healthCheckIntervalSeconds: 30,
  alertThresholds: DEFAULT_THRESHOLDS,
  pingsPerCheck: 4,
  pingTimeoutMs: 5000,
  maxConcurrentPings: 50,
  metricsRetentionDays: 30,
  scan: DEFAULT_SCAN_CONFIG,
};

export const SERVER_PORT = 3001;
