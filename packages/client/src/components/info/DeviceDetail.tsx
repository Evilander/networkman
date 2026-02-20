import React, { useState, useCallback } from 'react';
import { useDeviceStore } from '../../stores/deviceStore';
import { HeartContainer } from '../health/HeartContainer';
import { MetricsChart } from './MetricsChart';
import { PixelText } from '../shared/PixelText';
import { OoTButton } from '../shared/OoTButton';
import { OoTFrame } from '../shared/OoTFrame';
import styles from './DeviceDetail.module.css';

interface DeviceDetailProps {
  deviceId: string;
}

interface PingResult {
  device: string;
  ip: string;
  alive: boolean;
  time: number | null;
  packetLoss: number;
  output: string;
}

interface SpeedTestResult {
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  jitter: number;
  packetLoss: number;
  timestamp: string;
}

type DeviceType = 'router' | 'server' | 'printer' | 'phone' | 'computer' | 'unknown';

function getDeviceType(ip: string, hostname: string | null, name: string): DeviceType {
  const h = (hostname ?? '').toLowerCase();
  const n = name.toLowerCase();
  const combined = `${h} ${n}`;

  if (ip.endsWith('.1') || /router|gateway|gw/i.test(combined)) return 'router';
  if (/server|srv|nas|dc\d/i.test(combined)) return 'server';
  if (/printer|prn|print/i.test(combined)) return 'printer';
  if (/phone|iphone|android|mobile/i.test(combined)) return 'phone';
  if (/pc|desktop|laptop|workstation/i.test(combined)) return 'computer';
  return 'unknown';
}

function DeviceTypeIcon({ type, status }: { type: DeviceType; status: string }) {
  const color = status === 'online' ? 'var(--oot-green-light)' :
    status === 'degraded' ? 'var(--oot-gold-light)' :
    status === 'offline' ? 'var(--oot-red-heart)' :
    'var(--oot-brown-light)';

  const icons: Record<DeviceType, React.ReactElement> = {
    router: (
      <svg viewBox="0 0 32 32" width="32" height="32">
        <rect x="4" y="14" width="24" height="12" rx="2" fill={color} opacity="0.9" />
        <circle cx="9" cy="20" r="2" fill="var(--oot-bg-darkest)" />
        <circle cx="15" cy="20" r="2" fill="var(--oot-bg-darkest)" />
        <line x1="16" y1="14" x2="16" y2="6" stroke={color} strokeWidth="2" />
        <line x1="10" y1="14" x2="6" y2="6" stroke={color} strokeWidth="1.5" />
        <line x1="22" y1="14" x2="26" y2="6" stroke={color} strokeWidth="1.5" />
        <circle cx="16" cy="5" r="2" fill={color} />
        <circle cx="6" cy="5" r="1.5" fill={color} opacity="0.7" />
        <circle cx="26" cy="5" r="1.5" fill={color} opacity="0.7" />
      </svg>
    ),
    server: (
      <svg viewBox="0 0 32 32" width="32" height="32">
        <rect x="6" y="2" width="20" height="8" rx="1" fill={color} opacity="0.9" />
        <rect x="6" y="12" width="20" height="8" rx="1" fill={color} opacity="0.8" />
        <rect x="6" y="22" width="20" height="8" rx="1" fill={color} opacity="0.7" />
        <circle cx="10" cy="6" r="1.5" fill="var(--oot-bg-darkest)" />
        <circle cx="10" cy="16" r="1.5" fill="var(--oot-bg-darkest)" />
        <circle cx="10" cy="26" r="1.5" fill="var(--oot-bg-darkest)" />
        <rect x="18" y="5" width="5" height="2" rx="0.5" fill="var(--oot-bg-darkest)" />
        <rect x="18" y="15" width="5" height="2" rx="0.5" fill="var(--oot-bg-darkest)" />
        <rect x="18" y="25" width="5" height="2" rx="0.5" fill="var(--oot-bg-darkest)" />
      </svg>
    ),
    printer: (
      <svg viewBox="0 0 32 32" width="32" height="32">
        <rect x="8" y="2" width="16" height="8" rx="1" fill={color} opacity="0.7" />
        <rect x="4" y="10" width="24" height="12" rx="2" fill={color} opacity="0.9" />
        <rect x="8" y="22" width="16" height="8" rx="1" fill={color} opacity="0.6" />
        <rect x="10" y="24" width="12" height="1" fill="var(--oot-bg-darkest)" />
        <rect x="10" y="26" width="8" height="1" fill="var(--oot-bg-darkest)" />
        <circle cx="22" cy="16" r="1.5" fill="var(--oot-green-light)" />
      </svg>
    ),
    phone: (
      <svg viewBox="0 0 32 32" width="32" height="32">
        <rect x="9" y="2" width="14" height="28" rx="3" fill={color} opacity="0.9" />
        <rect x="11" y="5" width="10" height="18" rx="1" fill="var(--oot-bg-darkest)" />
        <circle cx="16" cy="27" r="2" fill="var(--oot-bg-darkest)" />
      </svg>
    ),
    computer: (
      <svg viewBox="0 0 32 32" width="32" height="32">
        <rect x="3" y="3" width="26" height="18" rx="2" fill={color} opacity="0.9" />
        <rect x="5" y="5" width="22" height="14" rx="1" fill="var(--oot-bg-darkest)" />
        <rect x="12" y="21" width="8" height="4" fill={color} opacity="0.7" />
        <rect x="8" y="25" width="16" height="3" rx="1" fill={color} opacity="0.8" />
      </svg>
    ),
    unknown: (
      <svg viewBox="0 0 32 32" width="32" height="32">
        <circle cx="16" cy="16" r="12" fill={color} opacity="0.3" stroke={color} strokeWidth="2" />
        <text x="16" y="21" textAnchor="middle" fontSize="14" fill={color} fontFamily="var(--oot-font-pixel)">?</text>
      </svg>
    ),
  };

  return <div className={styles.deviceIcon}>{icons[type]}</div>;
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return 'just now';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function getUptime(firstDiscovered: string): string {
  const now = Date.now();
  const then = new Date(firstDiscovered).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

function getLatencyColor(latency: number | null): 'primary' | 'highlight' | 'danger' {
  if (latency === null) return 'primary';
  if (latency < 30) return 'highlight';
  if (latency < 100) return 'primary';
  return 'danger';
}

function getLatencyLabel(latency: number | null): string {
  if (latency === null) return 'N/A';
  if (latency < 30) return `${Math.round(latency)}ms (Great)`;
  if (latency < 100) return `${Math.round(latency)}ms (OK)`;
  return `${Math.round(latency)}ms (Slow)`;
}

export function DeviceDetail({ deviceId }: DeviceDetailProps) {
  const device = useDeviceStore((s) => s.devices.get(deviceId));
  const selectDevice = useDeviceStore((s) => s.selectDevice);

  const [pingResult, setPingResult] = useState<PingResult | null>(null);
  const [pingLoading, setPingLoading] = useState(false);
  const [speedResult, setSpeedResult] = useState<SpeedTestResult | null>(null);
  const [speedLoading, setSpeedLoading] = useState(false);

  const handlePing = useCallback(async () => {
    if (!device) return;
    setPingLoading(true);
    setPingResult(null);
    try {
      const res = await fetch(`/api/devices/${device.id}/ping`, { method: 'POST' });
      const data: PingResult = await res.json();
      setPingResult(data);
    } catch {
      setPingResult({
        device: device.name,
        ip: device.ip,
        alive: false,
        time: null,
        packetLoss: 100,
        output: 'Request failed',
      });
    }
    setPingLoading(false);
  }, [device]);

  const handleSpeedTest = useCallback(async () => {
    if (!device) return;
    setSpeedLoading(true);
    setSpeedResult(null);
    try {
      const res = await fetch(`/api/devices/${device.id}/speedtest`, { method: 'POST' });
      const data: SpeedTestResult = await res.json();
      setSpeedResult(data);
    } catch {
      setSpeedResult(null);
    }
    setSpeedLoading(false);
  }, [device]);

  if (!device) {
    return (
      <div className={styles.container}>
        <PixelText size="xs" color="secondary">Device not found</PixelText>
      </div>
    );
  }

  const statusColor = {
    online: 'highlight' as const,
    degraded: 'highlight' as const,
    offline: 'danger' as const,
    unknown: 'secondary' as const,
  }[device.status];

  const deviceType = getDeviceType(device.ip, device.hostname, device.name);

  return (
    <div className={styles.container}>
      {/* Back button */}
      <div className={styles.header}>
        <OoTButton size="sm" variant="secondary" onClick={() => selectDevice(null)}>
          &#9664; Back
        </OoTButton>
      </div>

      {/* Device identity row */}
      <div className={styles.identityRow}>
        <DeviceTypeIcon type={deviceType} status={device.status} />
        <div className={styles.identityInfo}>
          <div className={styles.nameRow}>
            <PixelText size="md" color="highlight">{device.name}</PixelText>
            <span className={`${styles.statusBadge} ${styles[device.status]}`}>
              <PixelText size="xs" color={statusColor}>{device.status.toUpperCase()}</PixelText>
            </span>
          </div>
          <PixelText size="xs" color="secondary">{deviceType.toUpperCase()}</PixelText>
        </div>
      </div>

      {/* Health hearts - larger display */}
      <div className={styles.healthSection}>
        <PixelText size="xs" color="secondary">Health</PixelText>
        <div className={styles.heartDisplay}>
          <HeartContainer heartCount={device.heartCount} maxHearts={10} />
        </div>
        <PixelText size="xs" color={device.heartCount <= 3 ? 'danger' : 'highlight'}>
          {device.heartCount}/10 Hearts
        </PixelText>
      </div>

      {/* Uptime display */}
      <div className={styles.uptimeSection}>
        <OoTFrame variant="hud">
          <div className={styles.uptimeInner}>
            <PixelText size="xs" color="secondary">Uptime (since discovered)</PixelText>
            <PixelText size="sm" color="highlight">{getUptime(device.firstDiscovered)}</PixelText>
          </div>
        </OoTFrame>
      </div>

      {/* Network details */}
      <div className={styles.section}>
        <PixelText size="xs" color="secondary">Network Details</PixelText>
        <div className={styles.details}>
          <div className={styles.detailRow}>
            <PixelText size="xs" color="secondary">IP Address</PixelText>
            <PixelText size="xs">{device.ip}</PixelText>
          </div>
          {device.mac && (
            <div className={styles.detailRow}>
              <PixelText size="xs" color="secondary">MAC</PixelText>
              <PixelText size="xs">{device.mac}</PixelText>
            </div>
          )}
          {device.hostname && (
            <div className={styles.detailRow}>
              <PixelText size="xs" color="secondary">Hostname</PixelText>
              <PixelText size="xs">{device.hostname}</PixelText>
            </div>
          )}
          <div className={styles.detailRow}>
            <PixelText size="xs" color="secondary">Status</PixelText>
            <PixelText size="xs" color={statusColor}>{device.status.toUpperCase()}</PixelText>
          </div>
          <div className={styles.detailRow}>
            <PixelText size="xs" color="secondary">Latency</PixelText>
            <PixelText size="xs" color={getLatencyColor(device.latency)}>
              {getLatencyLabel(device.latency)}
            </PixelText>
          </div>
          <div className={styles.detailRow}>
            <PixelText size="xs" color="secondary">Packet Loss</PixelText>
            <PixelText size="xs" color={device.packetLoss && device.packetLoss > 5 ? 'danger' : 'primary'}>
              {device.packetLoss !== null ? `${device.packetLoss}%` : 'N/A'}
            </PixelText>
          </div>
          <div className={styles.detailRow}>
            <PixelText size="xs" color="secondary">Last Seen</PixelText>
            <PixelText size="xs">
              {device.lastSeen ? getRelativeTime(device.lastSeen) : 'Never'}
            </PixelText>
          </div>
          <div className={styles.detailRow}>
            <PixelText size="xs" color="secondary">First Discovered</PixelText>
            <PixelText size="xs">
              {new Date(device.firstDiscovered).toLocaleDateString()}
            </PixelText>
          </div>
        </div>
      </div>

      {/* Tags */}
      {device.tags.length > 0 && (
        <div className={styles.section}>
          <PixelText size="xs" color="secondary">Tags</PixelText>
          <div className={styles.tags}>
            {device.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                <PixelText size="xs">{tag}</PixelText>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions row */}
      <div className={styles.actions}>
        <OoTButton
          size="sm"
          onClick={handlePing}
          disabled={pingLoading}
        >
          {pingLoading ? 'Pinging...' : 'Ping Now'}
        </OoTButton>
        <OoTButton
          size="sm"
          variant="secondary"
          onClick={handleSpeedTest}
          disabled={speedLoading}
        >
          {speedLoading ? 'Testing...' : 'Speed Test'}
        </OoTButton>
        <OoTButton
          size="sm"
          variant="danger"
          onClick={() => {
            if (confirm(`Remove ${device.name}?`)) {
              fetch(`/api/devices/${device.id}`, { method: 'DELETE' });
              selectDevice(null);
            }
          }}
        >
          Remove
        </OoTButton>
      </div>

      {/* Ping result display */}
      {pingResult && (
        <div className={styles.resultBox}>
          <OoTFrame variant="hud">
            <div className={styles.resultContent}>
              <div className={styles.resultHeader}>
                <PixelText size="xs" color="highlight">Ping Result</PixelText>
                <span className={`${styles.resultIndicator} ${pingResult.alive ? styles.resultAlive : styles.resultDead}`} />
              </div>
              <div className={styles.resultGrid}>
                <div className={styles.resultItem}>
                  <PixelText size="xs" color="secondary">Status</PixelText>
                  <PixelText size="xs" color={pingResult.alive ? 'highlight' : 'danger'}>
                    {pingResult.alive ? 'ALIVE' : 'DEAD'}
                  </PixelText>
                </div>
                <div className={styles.resultItem}>
                  <PixelText size="xs" color="secondary">Time</PixelText>
                  <PixelText size="xs" color={getLatencyColor(pingResult.time)}>
                    {pingResult.time !== null ? `${Math.round(pingResult.time)}ms` : 'N/A'}
                  </PixelText>
                </div>
                <div className={styles.resultItem}>
                  <PixelText size="xs" color="secondary">Pkt Loss</PixelText>
                  <PixelText size="xs" color={pingResult.packetLoss > 0 ? 'danger' : 'highlight'}>
                    {pingResult.packetLoss}%
                  </PixelText>
                </div>
              </div>
            </div>
          </OoTFrame>
        </div>
      )}

      {/* Speed test result display */}
      {speedResult && (
        <div className={styles.resultBox}>
          <OoTFrame variant="hud">
            <div className={styles.resultContent}>
              <div className={styles.resultHeader}>
                <PixelText size="xs" color="highlight">Speed Test Result</PixelText>
              </div>
              <div className={styles.resultGrid}>
                <div className={styles.resultItem}>
                  <PixelText size="xs" color="secondary">Avg Latency</PixelText>
                  <PixelText size="xs" color={getLatencyColor(speedResult.avgLatency)}>
                    {Math.round(speedResult.avgLatency * 100) / 100}ms
                  </PixelText>
                </div>
                <div className={styles.resultItem}>
                  <PixelText size="xs" color="secondary">Min</PixelText>
                  <PixelText size="xs">{Math.round(speedResult.minLatency * 100) / 100}ms</PixelText>
                </div>
                <div className={styles.resultItem}>
                  <PixelText size="xs" color="secondary">Max</PixelText>
                  <PixelText size="xs">{Math.round(speedResult.maxLatency * 100) / 100}ms</PixelText>
                </div>
                <div className={styles.resultItem}>
                  <PixelText size="xs" color="secondary">Jitter</PixelText>
                  <PixelText size="xs" color={speedResult.jitter > 10 ? 'danger' : 'highlight'}>
                    {Math.round(speedResult.jitter * 100) / 100}ms
                  </PixelText>
                </div>
                <div className={styles.resultItem}>
                  <PixelText size="xs" color="secondary">Pkt Loss</PixelText>
                  <PixelText size="xs" color={speedResult.packetLoss > 0 ? 'danger' : 'highlight'}>
                    {speedResult.packetLoss}%
                  </PixelText>
                </div>
              </div>
            </div>
          </OoTFrame>
        </div>
      )}

      {/* Metrics chart */}
      <div className={styles.section}>
        <PixelText size="xs" color="secondary">Latency History</PixelText>
        <MetricsChart deviceId={deviceId} />
      </div>
    </div>
  );
}
