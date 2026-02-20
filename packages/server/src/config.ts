import { DEFAULT_CONFIG, type DashboardConfig } from '@networkman/shared';

export interface ServerConfig {
  port: number;
  dataDir: string;
  dashboard: DashboardConfig;
}

export function loadServerConfig(): ServerConfig {
  return {
    port: parseInt(process.env.PORT || '3001', 10),
    dataDir: process.env.NETWORKMAN_DATA_DIR || process.env.DATA_DIR || './data',
    dashboard: { ...DEFAULT_CONFIG },
  };
}
