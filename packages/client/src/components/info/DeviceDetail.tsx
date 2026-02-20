import { useDeviceStore } from '../../stores/deviceStore';
import { HeartContainer } from '../health/HeartContainer';
import { MetricsChart } from './MetricsChart';
import { PixelText } from '../shared/PixelText';
import { OoTButton } from '../shared/OoTButton';
import styles from './DeviceDetail.module.css';

interface DeviceDetailProps {
  deviceId: string;
}

export function DeviceDetail({ deviceId }: DeviceDetailProps) {
  const device = useDeviceStore((s) => s.devices.get(deviceId));
  const selectDevice = useDeviceStore((s) => s.selectDevice);

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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <OoTButton size="sm" variant="secondary" onClick={() => selectDevice(null)}>
          &#9664; Back
        </OoTButton>
      </div>

      {/* Device name and status */}
      <div className={styles.nameRow}>
        <PixelText size="md" color="highlight">{device.name}</PixelText>
        <span className={`${styles.statusBadge} ${styles[device.status]}`}>
          <PixelText size="xs" color={statusColor}>{device.status.toUpperCase()}</PixelText>
        </span>
      </div>

      {/* Hearts */}
      <div className={styles.section}>
        <PixelText size="xs" color="secondary">Health</PixelText>
        <HeartContainer heartCount={device.heartCount} maxHearts={10} />
      </div>

      {/* Details grid */}
      <div className={styles.details}>
        <div className={styles.detailRow}>
          <PixelText size="xs" color="secondary">IP</PixelText>
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
            <PixelText size="xs" color="secondary">Host</PixelText>
            <PixelText size="xs">{device.hostname}</PixelText>
          </div>
        )}
        <div className={styles.detailRow}>
          <PixelText size="xs" color="secondary">Latency</PixelText>
          <PixelText size="xs" color={device.latency && device.latency > 100 ? 'danger' : 'primary'}>
            {device.latency !== null ? `${Math.round(device.latency)}ms` : 'N/A'}
          </PixelText>
        </div>
        <div className={styles.detailRow}>
          <PixelText size="xs" color="secondary">Pkt Loss</PixelText>
          <PixelText size="xs" color={device.packetLoss && device.packetLoss > 5 ? 'danger' : 'primary'}>
            {device.packetLoss !== null ? `${device.packetLoss}%` : 'N/A'}
          </PixelText>
        </div>
        {device.lastSeen && (
          <div className={styles.detailRow}>
            <PixelText size="xs" color="secondary">Last Seen</PixelText>
            <PixelText size="xs">{new Date(device.lastSeen).toLocaleTimeString()}</PixelText>
          </div>
        )}
        {device.tags.length > 0 && (
          <div className={styles.detailRow}>
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
      </div>

      {/* Metrics chart */}
      <div className={styles.section}>
        <PixelText size="xs" color="secondary">Latency History</PixelText>
        <MetricsChart deviceId={deviceId} />
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <OoTButton
          size="sm"
          onClick={() => fetch(`/api/devices/${device.id}/ping`, { method: 'POST' })}
        >
          Ping
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
    </div>
  );
}
