import React, { useMemo } from 'react';
import type { Device } from '@networkman/shared';
import { useDeviceStore } from '../../stores/deviceStore';
import { HeartContainer } from '../health/HeartContainer';
import { PixelText } from '../shared/PixelText';
import styles from './MapDevice.module.css';

interface MapDeviceProps {
  device: Device;
}

type DeviceType = 'router' | 'switch' | 'server' | 'printer' | 'phone' | 'workstation';

function detectDeviceType(device: Device): DeviceType {
  const hostname = (device.hostname ?? device.name ?? '').toLowerCase();
  const ip = device.ip ?? '';

  if (hostname.includes('router') || hostname.includes('gateway') || /\.1$/.test(ip)) {
    return 'router';
  }
  if (hostname.includes('switch')) {
    return 'switch';
  }
  if (hostname.includes('server') || hostname.includes('srv')) {
    return 'server';
  }
  if (hostname.includes('printer') || hostname.includes('print')) {
    return 'printer';
  }
  if (hostname.includes('phone') || hostname.includes('voip')) {
    return 'phone';
  }
  return 'workstation';
}

function deviceTypeLabel(type: DeviceType): string {
  switch (type) {
    case 'router': return 'Router';
    case 'switch': return 'Switch';
    case 'server': return 'Server';
    case 'printer': return 'Printer';
    case 'phone': return 'Phone';
    case 'workstation': return 'Workstation';
  }
}

/** OoT-style pixel art castle gate icon for routers */
function RouterIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" shapeRendering="crispEdges">
      {/* Base wall */}
      <rect x="2" y="16" width="24" height="10" fill="#8b7355" />
      <rect x="2" y="16" width="24" height="2" fill="#a0896c" />
      {/* Gate arch */}
      <rect x="10" y="18" width="8" height="8" fill="#3e2723" />
      <rect x="10" y="16" width="8" height="2" fill="#5d4037" />
      <rect x="12" y="14" width="4" height="2" fill="#5d4037" />
      {/* Gate bars */}
      <rect x="12" y="18" width="1" height="8" fill="#6d4c41" />
      <rect x="15" y="18" width="1" height="8" fill="#6d4c41" />
      {/* Left tower */}
      <rect x="0" y="8" width="6" height="18" fill="#9e8e72" />
      <rect x="0" y="8" width="6" height="2" fill="#b0a18a" />
      {/* Left battlement */}
      <rect x="0" y="4" width="2" height="4" fill="#9e8e72" />
      <rect x="4" y="4" width="2" height="4" fill="#9e8e72" />
      <rect x="0" y="4" width="2" height="1" fill="#b0a18a" />
      <rect x="4" y="4" width="2" height="1" fill="#b0a18a" />
      {/* Right tower */}
      <rect x="22" y="8" width="6" height="18" fill="#9e8e72" />
      <rect x="22" y="8" width="6" height="2" fill="#b0a18a" />
      {/* Right battlement */}
      <rect x="22" y="4" width="2" height="4" fill="#9e8e72" />
      <rect x="26" y="4" width="2" height="4" fill="#9e8e72" />
      <rect x="22" y="4" width="2" height="1" fill="#b0a18a" />
      <rect x="26" y="4" width="2" height="1" fill="#b0a18a" />
      {/* Tower windows */}
      <rect x="2" y="12" width="2" height="2" fill="#f4d03f" />
      <rect x="24" y="12" width="2" height="2" fill="#f4d03f" />
      {/* Center banner */}
      <rect x="12" y="8" width="4" height="6" fill="#e53935" />
      <rect x="13" y="9" width="2" height="2" fill="#f4d03f" />
      {/* Arrow indicators (network routing) */}
      <rect x="8" y="2" width="2" height="4" fill="#7ec850" />
      <rect x="7" y="4" width="1" height="2" fill="#7ec850" />
      <rect x="18" y="2" width="2" height="4" fill="#7ec850" />
      <rect x="20" y="4" width="1" height="2" fill="#7ec850" />
    </svg>
  );
}

/** OoT-style pixel art bridge icon for switches */
function SwitchIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" shapeRendering="crispEdges">
      {/* Water beneath */}
      <rect x="0" y="22" width="28" height="6" fill="#1565c0" />
      <rect x="2" y="23" width="4" height="1" fill="#42a5f5" />
      <rect x="10" y="24" width="3" height="1" fill="#42a5f5" />
      <rect x="20" y="23" width="5" height="1" fill="#42a5f5" />
      {/* Left pillar */}
      <rect x="2" y="10" width="4" height="14" fill="#8b7355" />
      <rect x="2" y="10" width="4" height="2" fill="#a0896c" />
      <rect x="3" y="14" width="2" height="2" fill="#6d4c41" />
      {/* Right pillar */}
      <rect x="22" y="10" width="4" height="14" fill="#8b7355" />
      <rect x="22" y="10" width="4" height="2" fill="#a0896c" />
      <rect x="23" y="14" width="2" height="2" fill="#6d4c41" />
      {/* Bridge deck */}
      <rect x="2" y="18" width="24" height="4" fill="#a1887f" />
      <rect x="2" y="18" width="24" height="1" fill="#bcaaa4" />
      {/* Bridge planks */}
      <rect x="7" y="19" width="1" height="3" fill="#8d6e63" />
      <rect x="11" y="19" width="1" height="3" fill="#8d6e63" />
      <rect x="15" y="19" width="1" height="3" fill="#8d6e63" />
      <rect x="19" y="19" width="1" height="3" fill="#8d6e63" />
      {/* Bridge rails */}
      <rect x="6" y="14" width="16" height="1" fill="#6d4c41" />
      <rect x="6" y="16" width="16" height="1" fill="#6d4c41" />
      {/* Rail posts */}
      <rect x="6" y="14" width="1" height="4" fill="#8b7355" />
      <rect x="10" y="14" width="1" height="4" fill="#8b7355" />
      <rect x="14" y="14" width="1" height="4" fill="#8b7355" />
      <rect x="18" y="14" width="1" height="4" fill="#8b7355" />
      <rect x="21" y="14" width="1" height="4" fill="#8b7355" />
      {/* Network arrows on bridge */}
      <rect x="8" y="6" width="4" height="2" fill="#7ec850" />
      <rect x="12" y="4" width="2" height="2" fill="#7ec850" />
      <rect x="16" y="6" width="4" height="2" fill="#42a5f5" />
      <rect x="14" y="4" width="2" height="2" fill="#42a5f5" />
      {/* Connection dots */}
      <rect x="8" y="9" width="2" height="2" fill="#f4d03f" />
      <rect x="13" y="9" width="2" height="2" fill="#f4d03f" />
      <rect x="18" y="9" width="2" height="2" fill="#f4d03f" />
    </svg>
  );
}

/** OoT-style pixel art tower/fortress for servers */
function ServerIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" shapeRendering="crispEdges">
      {/* Tower base */}
      <rect x="6" y="14" width="16" height="14" fill="#546e7a" />
      <rect x="6" y="14" width="16" height="2" fill="#78909c" />
      {/* Foundation */}
      <rect x="4" y="26" width="20" height="2" fill="#37474f" />
      {/* Server rack rows */}
      <rect x="8" y="17" width="12" height="3" fill="#37474f" />
      <rect x="8" y="17" width="12" height="1" fill="#455a64" />
      <rect x="8" y="21" width="12" height="3" fill="#37474f" />
      <rect x="8" y="21" width="12" height="1" fill="#455a64" />
      {/* Status LEDs - row 1 */}
      <rect x="9" y="18" width="1" height="1" fill="#7ec850" />
      <rect x="11" y="18" width="1" height="1" fill="#7ec850" />
      <rect x="13" y="18" width="1" height="1" fill="#f4d03f" />
      <rect x="17" y="18" width="2" height="1" fill="#90caf9" />
      {/* Status LEDs - row 2 */}
      <rect x="9" y="22" width="1" height="1" fill="#7ec850" />
      <rect x="11" y="22" width="1" height="1" fill="#7ec850" />
      <rect x="13" y="22" width="1" height="1" fill="#7ec850" />
      <rect x="17" y="22" width="2" height="1" fill="#90caf9" />
      {/* Pointed roof / spire */}
      <rect x="8" y="12" width="12" height="2" fill="#78909c" />
      <rect x="10" y="10" width="8" height="2" fill="#78909c" />
      <rect x="12" y="8" width="4" height="2" fill="#78909c" />
      <rect x="13" y="6" width="2" height="2" fill="#78909c" />
      {/* Roof edge highlights */}
      <rect x="8" y="12" width="12" height="1" fill="#90a4ae" />
      <rect x="10" y="10" width="8" height="1" fill="#90a4ae" />
      <rect x="12" y="8" width="4" height="1" fill="#90a4ae" />
      {/* Spire top beacon */}
      <rect x="13" y="4" width="2" height="2" fill="#e53935" />
      <rect x="13" y="3" width="2" height="1" fill="#f44336" />
      {/* Flag on top */}
      <rect x="15" y="2" width="4" height="3" fill="#42a5f5" />
      <rect x="15" y="2" width="4" height="1" fill="#90caf9" />
      {/* Window */}
      <rect x="12" y="25" width="4" height="2" fill="#263238" />
      <rect x="13" y="25" width="1" height="2" fill="#37474f" />
    </svg>
  );
}

/** OoT-style pixel art treasure chest for printers */
function PrinterIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" shapeRendering="crispEdges">
      {/* Chest body */}
      <rect x="3" y="14" width="22" height="12" fill="#8b6914" />
      <rect x="3" y="14" width="22" height="2" fill="#c9a227" />
      {/* Chest lid */}
      <rect x="3" y="8" width="22" height="6" fill="#a07818" />
      <rect x="3" y="8" width="22" height="2" fill="#c9a227" />
      {/* Lid curve */}
      <rect x="5" y="6" width="18" height="2" fill="#a07818" />
      <rect x="5" y="6" width="18" height="1" fill="#c9a227" />
      <rect x="7" y="5" width="14" height="1" fill="#b08820" />
      {/* Metal bands */}
      <rect x="3" y="12" width="22" height="2" fill="#6d4c41" />
      <rect x="3" y="12" width="22" height="1" fill="#8d6e63" />
      <rect x="3" y="22" width="22" height="2" fill="#6d4c41" />
      <rect x="3" y="22" width="22" height="1" fill="#8d6e63" />
      {/* Center latch */}
      <rect x="11" y="11" width="6" height="6" fill="#6d4c41" />
      <rect x="12" y="12" width="4" height="4" fill="#f4d03f" />
      <rect x="13" y="13" width="2" height="2" fill="#c9a227" />
      {/* Keyhole */}
      <rect x="13" y="14" width="2" height="1" fill="#3e2723" />
      {/* Corner rivets */}
      <rect x="4" y="9" width="2" height="2" fill="#c9a227" />
      <rect x="22" y="9" width="2" height="2" fill="#c9a227" />
      <rect x="4" y="18" width="2" height="2" fill="#c9a227" />
      <rect x="22" y="18" width="2" height="2" fill="#c9a227" />
      {/* Paper coming out (printer hint) */}
      <rect x="8" y="2" width="12" height="4" fill="#f5f5dc" />
      <rect x="8" y="2" width="12" height="1" fill="#ffffff" />
      <rect x="10" y="3" width="8" height="1" fill="#bdb76b" />
      {/* Feet */}
      <rect x="5" y="26" width="3" height="2" fill="#5d4037" />
      <rect x="20" y="26" width="3" height="2" fill="#5d4037" />
    </svg>
  );
}

/** OoT-style pixel art phone/communication stone */
function PhoneIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" shapeRendering="crispEdges">
      {/* Gossip stone base */}
      <rect x="8" y="20" width="12" height="8" fill="#78909c" />
      <rect x="6" y="24" width="16" height="4" fill="#607d8b" />
      <rect x="8" y="20" width="12" height="2" fill="#90a4ae" />
      {/* Stone body */}
      <rect x="6" y="10" width="16" height="12" fill="#90a4ae" />
      <rect x="6" y="10" width="16" height="2" fill="#b0bec5" />
      {/* Rounded top */}
      <rect x="8" y="6" width="12" height="4" fill="#90a4ae" />
      <rect x="10" y="4" width="8" height="2" fill="#90a4ae" />
      <rect x="8" y="6" width="12" height="1" fill="#b0bec5" />
      <rect x="10" y="4" width="8" height="1" fill="#b0bec5" />
      {/* Eye (Sheikah-style) */}
      <rect x="10" y="12" width="8" height="4" fill="#1a237e" />
      <rect x="12" y="11" width="4" height="6" fill="#1a237e" />
      <rect x="12" y="13" width="4" height="2" fill="#e53935" />
      <rect x="13" y="12" width="2" height="4" fill="#e53935" />
      {/* Pupil */}
      <rect x="13" y="13" width="2" height="2" fill="#f44336" />
      {/* Teardrop */}
      <rect x="13" y="17" width="2" height="2" fill="#1a237e" />
      <rect x="13" y="19" width="2" height="1" fill="#283593" />
      {/* Sound waves */}
      <rect x="3" y="8" width="2" height="1" fill="#42a5f5" />
      <rect x="1" y="10" width="2" height="1" fill="#42a5f5" />
      <rect x="3" y="12" width="2" height="1" fill="#42a5f5" />
      <rect x="23" y="8" width="2" height="1" fill="#42a5f5" />
      <rect x="25" y="10" width="2" height="1" fill="#42a5f5" />
      <rect x="23" y="12" width="2" height="1" fill="#42a5f5" />
      {/* Glow on top */}
      <rect x="12" y="2" width="4" height="2" fill="#42a5f5" />
      <rect x="13" y="1" width="2" height="1" fill="#90caf9" />
    </svg>
  );
}

/** OoT-style pixel art Kokiri hut for workstations */
function WorkstationIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" shapeRendering="crispEdges">
      {/* House body */}
      <rect x="4" y="14" width="20" height="12" fill="#8b7355" />
      <rect x="4" y="14" width="20" height="2" fill="#a0896c" />
      {/* Grass/ground */}
      <rect x="0" y="26" width="28" height="2" fill="#2d5a27" />
      <rect x="2" y="25" width="3" height="1" fill="#4a7c3f" />
      <rect x="22" y="25" width="4" height="1" fill="#4a7c3f" />
      {/* Roof - thatched triangle */}
      <rect x="2" y="12" width="24" height="2" fill="#4a7c3f" />
      <rect x="4" y="10" width="20" height="2" fill="#2d5a27" />
      <rect x="6" y="8" width="16" height="2" fill="#4a7c3f" />
      <rect x="8" y="6" width="12" height="2" fill="#2d5a27" />
      <rect x="10" y="4" width="8" height="2" fill="#4a7c3f" />
      <rect x="12" y="2" width="4" height="2" fill="#2d5a27" />
      {/* Roof highlight */}
      <rect x="2" y="12" width="24" height="1" fill="#7ec850" />
      <rect x="6" y="8" width="16" height="1" fill="#7ec850" />
      <rect x="10" y="4" width="8" height="1" fill="#7ec850" />
      {/* Door */}
      <rect x="11" y="20" width="6" height="6" fill="#5d4037" />
      <rect x="11" y="20" width="6" height="1" fill="#6d4c41" />
      <rect x="12" y="21" width="4" height="4" fill="#3e2723" />
      {/* Door handle */}
      <rect x="15" y="23" width="1" height="1" fill="#c9a227" />
      {/* Window left */}
      <rect x="6" y="17" width="4" height="4" fill="#3e2723" />
      <rect x="6" y="17" width="4" height="1" fill="#5d4037" />
      <rect x="7" y="18" width="2" height="2" fill="#f4d03f" />
      <rect x="8" y="17" width="1" height="4" fill="#5d4037" />
      {/* Window right */}
      <rect x="18" y="17" width="4" height="4" fill="#3e2723" />
      <rect x="18" y="17" width="4" height="1" fill="#5d4037" />
      <rect x="19" y="18" width="2" height="2" fill="#f4d03f" />
      <rect x="20" y="17" width="1" height="4" fill="#5d4037" />
      {/* Chimney */}
      <rect x="20" y="2" width="3" height="6" fill="#8b7355" />
      <rect x="20" y="2" width="3" height="1" fill="#a0896c" />
      {/* Chimney smoke */}
      <rect x="21" y="0" width="1" height="2" fill="#78909c" opacity="0.6" />
      <rect x="23" y="0" width="1" height="1" fill="#90a4ae" opacity="0.4" />
    </svg>
  );
}

const ICON_COMPONENTS: Record<DeviceType, () => React.ReactElement> = {
  router: RouterIcon,
  switch: SwitchIcon,
  server: ServerIcon,
  printer: PrinterIcon,
  phone: PhoneIcon,
  workstation: WorkstationIcon,
};

function statusLabel(status: Device['status']): string {
  switch (status) {
    case 'online': return 'Online';
    case 'degraded': return 'Degraded';
    case 'offline': return 'Offline';
    case 'unknown': return 'Unknown';
  }
}

export function MapDevice({ device }: MapDeviceProps) {
  const selectDevice = useDeviceStore((s) => s.selectDevice);
  const selectedId = useDeviceStore((s) => s.selectedDeviceId);
  const isSelected = selectedId === device.id;

  const deviceType = useMemo(() => detectDeviceType(device), [device]);
  const IconComponent = ICON_COMPONENTS[deviceType];

  const statusClass = {
    online: styles.online,
    degraded: styles.degraded,
    offline: styles.offline,
    unknown: styles.unknown,
  }[device.status];

  return (
    <div
      className={`${styles.device} ${statusClass} ${isSelected ? styles.selected : ''}`}
      style={{
        left: `${device.mapPosition?.x ?? 50}%`,
        top: `${device.mapPosition?.y ?? 50}%`,
      }}
      onClick={() => selectDevice(isSelected ? null : device.id)}
    >
      <div className={styles.marker}>
        <div className={styles.glowRing} />
        <div className={styles.iconWrap}>
          <IconComponent />
        </div>
      </div>
      <div className={styles.label}>
        <PixelText size="xs" color="secondary">{device.name}</PixelText>
      </div>
      <div className={styles.tooltip}>
        <div className={styles.tooltipHeader}>
          <div className={styles.tooltipIconMini}>
            <IconComponent />
          </div>
          <div className={styles.tooltipTitle}>
            <PixelText size="sm" color="highlight">{device.name}</PixelText>
            <PixelText size="xs" color="secondary">{deviceTypeLabel(deviceType)}</PixelText>
          </div>
        </div>
        <div className={styles.tooltipDivider} />
        <div className={styles.tooltipRow}>
          <PixelText size="xs" color="secondary">IP:</PixelText>
          <PixelText size="xs" color="primary">{device.ip}</PixelText>
        </div>
        {device.hostname && (
          <div className={styles.tooltipRow}>
            <PixelText size="xs" color="secondary">Host:</PixelText>
            <PixelText size="xs" color="primary">{device.hostname}</PixelText>
          </div>
        )}
        <div className={styles.tooltipRow}>
          <PixelText size="xs" color="secondary">Status:</PixelText>
          <span className={`${styles.tooltipStatus} ${styles[`tooltipStatus_${device.status}`]}`}>
            <PixelText size="xs" color="primary">{statusLabel(device.status)}</PixelText>
          </span>
        </div>
        {device.latency !== null && (
          <div className={styles.tooltipRow}>
            <PixelText size="xs" color="secondary">Latency:</PixelText>
            <PixelText size="xs" color="primary">{Math.round(device.latency)}ms</PixelText>
          </div>
        )}
        {device.packetLoss !== null && (
          <div className={styles.tooltipRow}>
            <PixelText size="xs" color="secondary">Loss:</PixelText>
            <PixelText size="xs" color="primary">{device.packetLoss.toFixed(1)}%</PixelText>
          </div>
        )}
        <div className={styles.tooltipDivider} />
        <div className={styles.tooltipHearts}>
          <PixelText size="xs" color="secondary">Health:</PixelText>
          <HeartContainer heartCount={device.heartCount} maxHearts={10} />
        </div>
        {device.lastSeen && (
          <div className={styles.tooltipRow}>
            <PixelText size="xs" color="secondary">Seen:</PixelText>
            <PixelText size="xs" color="primary">
              {new Date(device.lastSeen).toLocaleTimeString()}
            </PixelText>
          </div>
        )}
      </div>
    </div>
  );
}
