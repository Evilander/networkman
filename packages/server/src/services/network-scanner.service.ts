import crypto from 'node:crypto';
import pLimit from 'p-limit';
import { type DashboardConfig, type Device } from '@networkman/shared';
import { DeviceRepository } from '../database/repositories/device.repository.js';
import { pingHost } from '../utils/ping.js';
import { resolveHostname } from '../utils/hostname.js';
import { getIPRange } from '../utils/subnet.js';
import { logger } from '../utils/logger.js';

export interface ScanProgress {
  scanned: number;
  total: number;
  currentIp: string;
  found: number;
  elapsed: number;
  estimatedRemaining: number;
}

export interface ScanResult {
  devicesFound: number;
  newDevices: number;
  duration: number;
}

export class NetworkScannerService {
  private scanning = false;
  private abortRequested = false;

  constructor(
    private deviceRepo: DeviceRepository,
    private onProgress?: (progress: ScanProgress) => void,
    private onDeviceDiscovered?: (device: Device) => void,
  ) {}

  isScanning(): boolean {
    return this.scanning;
  }

  abort(): void {
    if (this.scanning) {
      this.abortRequested = true;
      logger.info('Scan abort requested');
    }
  }

  async scan(config: DashboardConfig): Promise<ScanResult> {
    if (this.scanning) {
      logger.warn('Scan already in progress, skipping');
      return { devicesFound: 0, newDevices: 0, duration: 0 };
    }

    this.scanning = true;
    this.abortRequested = false;
    const startTime = Date.now();
    let devicesFound = 0;
    let newDevices = 0;

    try {
      // Gather all IPs to scan
      const allIps: string[] = [];
      for (const subnet of config.subnets) {
        if (subnet.enabled) {
          allIps.push(...getIPRange(subnet.cidr));
        }
      }

      const total = allIps.length;
      logger.info(`Starting scan of ${total} hosts across ${config.subnets.filter(s => s.enabled).length} subnet(s)`);

      // Use scan-specific settings (fast discovery)
      const scanConfig = config.scan;
      const concurrency = scanConfig.maxConcurrentScanPings;
      const timeout = scanConfig.scanPingTimeoutMs;
      const pingsPerHost = scanConfig.scanPingsPerHost;
      const chunkSize = scanConfig.scanChunkSize;

      let scanned = 0;

      // Process in chunks to allow progress updates and abort checks
      for (let chunkStart = 0; chunkStart < total; chunkStart += chunkSize) {
        if (this.abortRequested) {
          logger.info('Scan aborted by user');
          break;
        }

        const chunk = allIps.slice(chunkStart, chunkStart + chunkSize);
        const limit = pLimit(concurrency);

        const tasks = chunk.map(ip =>
          limit(async () => {
            if (this.abortRequested) return;

            const result = await pingHost(ip, timeout, pingsPerHost);
            scanned++;

            // Emit progress every 10 hosts or on discovery (avoid flooding)
            if (scanned % 10 === 0 || result.alive) {
              const elapsed = Date.now() - startTime;
              const rate = scanned / (elapsed / 1000); // hosts per second
              const remaining = (total - scanned) / rate;
              this.onProgress?.({
                scanned,
                total,
                currentIp: ip,
                found: devicesFound,
                elapsed,
                estimatedRemaining: Math.round(remaining * 1000),
              });
            }

            if (result.alive) {
              devicesFound++;
              const existing = this.deviceRepo.findByIp(ip);
              if (!existing) {
                newDevices++;
                const id = crypto.randomUUID();
                const hostname = await resolveHostname(ip);
                const device = this.deviceRepo.upsertDiscovered(id, ip, hostname);
                this.onDeviceDiscovered?.(device);
                logger.info(`Discovered: ${ip}${hostname ? ` (${hostname})` : ''} (${Math.round(result.time ?? 0)}ms)`);
              }
            }
          })
        );

        await Promise.allSettled(tasks);

        // Log chunk progress for large scans
        if (total > 1000) {
          const pct = Math.round((scanned / total) * 100);
          const elapsed = Date.now() - startTime;
          logger.info(`Scan progress: ${pct}% (${scanned}/${total}) — ${devicesFound} found — ${Math.round(elapsed / 1000)}s elapsed`);
        }
      }
    } finally {
      this.scanning = false;
      this.abortRequested = false;
    }

    const duration = Date.now() - startTime;
    logger.info(`Scan complete: ${devicesFound} found, ${newDevices} new, ${Math.round(duration / 1000)}s`);
    return { devicesFound, newDevices, duration };
  }
}
