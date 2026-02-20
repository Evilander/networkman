export interface SubnetConfig {
  cidr: string;
  label: string;
  enabled: boolean;
}

export interface AlertThresholds {
  latencyWarningMs: number;
  latencyCriticalMs: number;
  packetLossWarningPct: number;
  packetLossCriticalPct: number;
  offlineAfterFailedPings: number;
}

export interface ScanConfig {
  /** Max concurrent pings during discovery scan */
  maxConcurrentScanPings: number;
  /** Timeout per ping during scan (ms) — keep low for speed */
  scanPingTimeoutMs: number;
  /** Number of pings per host during scan (1 = fast discovery) */
  scanPingsPerHost: number;
  /** For /16+ networks: scan in chunks of this size, with progress between chunks */
  scanChunkSize: number;
}

export interface DashboardConfig {
  subnets: SubnetConfig[];
  scanIntervalSeconds: number;
  healthCheckIntervalSeconds: number;
  alertThresholds: AlertThresholds;
  pingsPerCheck: number;
  pingTimeoutMs: number;
  maxConcurrentPings: number;
  metricsRetentionDays: number;
  scan: ScanConfig;
}
