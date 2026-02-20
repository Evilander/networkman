import { useEffect, useState } from 'react';
import type { Alert } from '@networkman/shared';
import { useAlertStore } from '../../stores/alertStore';
import { PixelText } from '../shared/PixelText';
import { OoTButton } from '../shared/OoTButton';
import styles from './AlertHistory.module.css';

function AlertRow({ alert }: { alert: Alert }) {
  const severityIcon = {
    critical: '!!',
    warning: '!',
    info: 'i',
  }[alert.severity];

  const severityClass = {
    critical: styles.critical,
    warning: styles.warning,
    info: styles.info,
  }[alert.severity];

  return (
    <div className={`${styles.row} ${alert.acknowledged ? styles.acknowledged : ''}`}>
      <span className={`${styles.icon} ${severityClass}`}>{severityIcon}</span>
      <div className={styles.rowContent}>
        <PixelText size="xs" color={alert.acknowledged ? 'secondary' : 'primary'}>
          {alert.message}
        </PixelText>
        <PixelText size="xs" color="secondary">
          {new Date(alert.timestamp).toLocaleTimeString()}
        </PixelText>
      </div>
    </div>
  );
}

export function AlertHistory() {
  const alerts = useAlertStore((s) => s.alerts);
  const setAlerts = useAlertStore((s) => s.setAlerts);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    fetch('/api/alerts?limit=100')
      .then((r) => r.json())
      .then((data) => { setAlerts(data); setLoaded(true); })
      .catch(() => {});
  }, [loaded, setAlerts]);

  const acknowledgeAll = () => {
    fetch('/api/alerts/acknowledge-all', { method: 'POST' })
      .then(() => fetch('/api/alerts?limit=100'))
      .then((r) => r.json())
      .then(setAlerts)
      .catch(() => {});
  };

  const unacked = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <PixelText size="xs" color="highlight">Navi's Log</PixelText>
        {unacked > 0 && (
          <OoTButton size="sm" onClick={acknowledgeAll}>
            Dismiss All ({unacked})
          </OoTButton>
        )}
      </div>
      <div className={styles.list}>
        {alerts.length === 0 ? (
          <div className={styles.empty}>
            <PixelText size="xs" color="secondary">
              All is quiet in Hyrule...
            </PixelText>
          </div>
        ) : (
          alerts.map((alert) => <AlertRow key={alert.id} alert={alert} />)
        )}
      </div>
    </div>
  );
}
