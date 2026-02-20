import type { Device } from '@networkman/shared';
import { useDeviceStore } from '../../stores/deviceStore';
import { HeartContainer } from '../health/HeartContainer';
import { PixelText } from '../shared/PixelText';
import styles from './MapDevice.module.css';

interface MapDeviceProps {
  device: Device;
}

export function MapDevice({ device }: MapDeviceProps) {
  const selectDevice = useDeviceStore((s) => s.selectDevice);
  const selectedId = useDeviceStore((s) => s.selectedDeviceId);
  const isSelected = selectedId === device.id;

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
      title={`${device.name} (${device.ip})`}
    >
      <div className={styles.marker}>
        <div className={styles.markerInner} />
      </div>
      <div className={styles.tooltip}>
        <PixelText size="xs" color="highlight">{device.name}</PixelText>
        <PixelText size="xs" color="secondary">{device.ip}</PixelText>
        <HeartContainer heartCount={device.heartCount} maxHearts={10} />
        {device.latency !== null && (
          <PixelText size="xs" color="secondary">{Math.round(device.latency)}ms</PixelText>
        )}
      </div>
    </div>
  );
}
