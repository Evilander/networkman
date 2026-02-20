import { useEffect, useState } from 'react';
import type { DashboardConfig } from '@networkman/shared';
import { OoTFrame } from '../components/shared/OoTFrame';
import { PixelText } from '../components/shared/PixelText';
import { OoTButton } from '../components/shared/OoTButton';
import styles from './Settings.module.css';

export function Settings() {
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/config').then((r) => r.json()).then(setConfig).catch(() => {});
  }, []);

  const save = async () => {
    if (!config) return;
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!config) return <PixelText size="sm">Loading config...</PixelText>;

  return (
    <div className={styles.container}>
      <OoTFrame variant="dialog">
        <PixelText size="md" color="highlight">Configuration</PixelText>

        <div className={styles.section}>
          <PixelText size="xs" color="secondary">Subnets</PixelText>
          {config.subnets.map((subnet, i) => (
            <div key={i} className={styles.row}>
              <input
                className={styles.input}
                value={subnet.cidr}
                onChange={(e) => {
                  const next = [...config.subnets];
                  next[i] = { ...next[i], cidr: e.target.value };
                  setConfig({ ...config, subnets: next });
                }}
              />
              <input
                className={styles.input}
                value={subnet.label}
                onChange={(e) => {
                  const next = [...config.subnets];
                  next[i] = { ...next[i], label: e.target.value };
                  setConfig({ ...config, subnets: next });
                }}
              />
            </div>
          ))}
        </div>

        <div className={styles.section}>
          <PixelText size="xs" color="secondary">Intervals</PixelText>
          <div className={styles.row}>
            <PixelText size="xs">Scan (sec)</PixelText>
            <input
              type="number"
              className={styles.input}
              value={config.scanIntervalSeconds}
              onChange={(e) => setConfig({ ...config, scanIntervalSeconds: parseInt(e.target.value) || 300 })}
            />
          </div>
          <div className={styles.row}>
            <PixelText size="xs">Health Check (sec)</PixelText>
            <input
              type="number"
              className={styles.input}
              value={config.healthCheckIntervalSeconds}
              onChange={(e) => setConfig({ ...config, healthCheckIntervalSeconds: parseInt(e.target.value) || 30 })}
            />
          </div>
        </div>

        <div className={styles.section}>
          <PixelText size="xs" color="secondary">Alert Thresholds</PixelText>
          <div className={styles.row}>
            <PixelText size="xs">Latency Warn (ms)</PixelText>
            <input
              type="number"
              className={styles.input}
              value={config.alertThresholds.latencyWarningMs}
              onChange={(e) => setConfig({
                ...config,
                alertThresholds: { ...config.alertThresholds, latencyWarningMs: parseInt(e.target.value) || 100 },
              })}
            />
          </div>
          <div className={styles.row}>
            <PixelText size="xs">Latency Crit (ms)</PixelText>
            <input
              type="number"
              className={styles.input}
              value={config.alertThresholds.latencyCriticalMs}
              onChange={(e) => setConfig({
                ...config,
                alertThresholds: { ...config.alertThresholds, latencyCriticalMs: parseInt(e.target.value) || 500 },
              })}
            />
          </div>
          <div className={styles.row}>
            <PixelText size="xs">Pkt Loss Warn (%)</PixelText>
            <input
              type="number"
              className={styles.input}
              value={config.alertThresholds.packetLossWarningPct}
              onChange={(e) => setConfig({
                ...config,
                alertThresholds: { ...config.alertThresholds, packetLossWarningPct: parseInt(e.target.value) || 5 },
              })}
            />
          </div>
        </div>

        <div className={styles.actions}>
          <OoTButton onClick={save}>Save Configuration</OoTButton>
          {saved && <PixelText size="xs" color="highlight">Saved!</PixelText>}
        </div>
      </OoTFrame>
    </div>
  );
}
