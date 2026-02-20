import { z } from 'zod';

export const deviceMapPositionSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  region: z.string().optional(),
});

export const deviceCreateSchema = z.object({
  name: z.string().min(1).max(100),
  ip: z.string().regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, 'Invalid IP address'),
  mac: z.string().nullable().optional(),
  hostname: z.string().nullable().optional(),
  mapPosition: deviceMapPositionSchema.nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const deviceUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  mapPosition: deviceMapPositionSchema.nullable().optional(),
  tags: z.array(z.string()).optional(),
  isManual: z.boolean().optional(),
});

export const subnetConfigSchema = z.object({
  cidr: z.string().regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/, 'Invalid CIDR'),
  label: z.string().min(1),
  enabled: z.boolean(),
});

export const alertThresholdsSchema = z.object({
  latencyWarningMs: z.number().positive(),
  latencyCriticalMs: z.number().positive(),
  packetLossWarningPct: z.number().min(0).max(100),
  packetLossCriticalPct: z.number().min(0).max(100),
  offlineAfterFailedPings: z.number().int().positive(),
});

export const scanConfigSchema = z.object({
  maxConcurrentScanPings: z.number().int().min(1).max(500),
  scanPingTimeoutMs: z.number().int().min(200).max(10000),
  scanPingsPerHost: z.number().int().min(1).max(5),
  scanChunkSize: z.number().int().min(32).max(4096),
});

export const dashboardConfigSchema = z.object({
  subnets: z.array(subnetConfigSchema),
  scanIntervalSeconds: z.number().int().min(10),
  healthCheckIntervalSeconds: z.number().int().min(5),
  alertThresholds: alertThresholdsSchema,
  pingsPerCheck: z.number().int().min(1).max(20),
  pingTimeoutMs: z.number().int().min(500).max(30000),
  maxConcurrentPings: z.number().int().min(1).max(500),
  metricsRetentionDays: z.number().int().min(1),
  scan: scanConfigSchema,
});

export const metricsQuerySchema = z.object({
  deviceId: z.string(),
  from: z.string().datetime(),
  to: z.string().datetime(),
  interval: z.number().int().positive().optional(),
});
