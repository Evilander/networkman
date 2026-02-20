import { useEffect, useState } from 'react';
import type { DashboardConfig } from '@networkman/shared';
import { OoTFrame } from '../components/shared/OoTFrame';
import { PixelText } from '../components/shared/PixelText';
import { OoTButton } from '../components/shared/OoTButton';
import styles from './Settings.module.css';

export function Settings() {
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    fetch('/api/config').then((r) => r.json()).then(setConfig).catch(() => {});
  }, []);

  const save = async () => {
    if (!config) return;
    setError(null);
    try {
      const res = await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ? JSON.stringify(data.error) : 'Save failed');
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Failed to save configuration');
    }
  };

  const triggerScan = async () => {
    setScanning(true);
    try {
      await fetch('/api/scan', { method: 'POST' });
    } catch {
      // ignore
    }
    setScanning(false);
  };

  const addSubnet = () => {
    if (!config) return;
    setConfig({
      ...config,
      subnets: [...config.subnets, { cidr: '192.168.1.0/24', label: 'New Subnet', enabled: true }],
    });
  };

  const removeSubnet = (index: number) => {
    if (!config || config.subnets.length <= 1) return;
    setConfig({
      ...config,
      subnets: config.subnets.filter((_, i) => i !== index),
    });
  };

  const toggleSubnet = (index: number) => {
    if (!config) return;
    const next = [...config.subnets];
    next[index] = { ...next[index], enabled: !next[index].enabled };
    setConfig({ ...config, subnets: next });
  };

  if (!config) return <PixelText size="sm">Loading config...</PixelText>;

  return (
    <div className={styles.container}>
      <OoTFrame variant="dialog">
        <PixelText size="md" color="highlight">Configuration</PixelText>

        {/* Quick start hint */}
        <div className={styles.hint}>
          <PixelText size="xs" color="secondary">
            Set your network subnet below (e.g. 10.0.0.0/24 for your LAN), then Save and Scan.
          </PixelText>
        </div>

        {/* Subnets */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <PixelText size="xs" color="secondary">Subnets</PixelText>
            <OoTButton size="sm" variant="secondary" onClick={addSubnet}>+ Add</OoTButton>
          </div>
          {config.subnets.map((subnet, i) => (
            <div key={i} className={`${styles.subnetRow} ${!subnet.enabled ? styles.subnetDisabled : ''}`}>
              <div className={styles.subnetFields}>
                <div className={styles.fieldGroup}>
                  <PixelText size="xs" color="secondary">CIDR</PixelText>
                  <input
                    className={styles.input}
                    value={subnet.cidr}
                    placeholder="10.0.0.0/24"
                    onChange={(e) => {
                      const next = [...config.subnets];
                      next[i] = { ...next[i], cidr: e.target.value };
                      setConfig({ ...config, subnets: next });
                    }}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <PixelText size="xs" color="secondary">Label</PixelText>
                  <input
                    className={styles.input}
                    value={subnet.label}
                    placeholder="My Network"
                    onChange={(e) => {
                      const next = [...config.subnets];
                      next[i] = { ...next[i], label: e.target.value };
                      setConfig({ ...config, subnets: next });
                    }}
                  />
                </div>
              </div>
              <div className={styles.subnetActions}>
                <button
                  className={`${styles.toggleBtn} ${subnet.enabled ? styles.toggleOn : styles.toggleOff}`}
                  onClick={() => toggleSubnet(i)}
                  title={subnet.enabled ? 'Disable' : 'Enable'}
                >
                  <PixelText size="xs">{subnet.enabled ? 'ON' : 'OFF'}</PixelText>
                </button>
                {config.subnets.length > 1 && (
                  <button className={styles.removeBtn} onClick={() => removeSubnet(i)} title="Remove subnet">
                    <PixelText size="xs" color="danger">X</PixelText>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Intervals */}
        <div className={styles.section}>
          <PixelText size="xs" color="secondary">Intervals</PixelText>
          <div className={styles.row}>
            <PixelText size="xs">Scan Interval (sec)</PixelText>
            <input
              type="number"
              className={styles.input}
              value={config.scanIntervalSeconds}
              min={10}
              onChange={(e) => setConfig({ ...config, scanIntervalSeconds: parseInt(e.target.value) || 300 })}
            />
          </div>
          <div className={styles.row}>
            <PixelText size="xs">Health Check (sec)</PixelText>
            <input
              type="number"
              className={styles.input}
              value={config.healthCheckIntervalSeconds}
              min={5}
              onChange={(e) => setConfig({ ...config, healthCheckIntervalSeconds: parseInt(e.target.value) || 30 })}
            />
          </div>
        </div>

        {/* Alert Thresholds */}
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
          <div className={styles.row}>
            <PixelText size="xs">Pkt Loss Crit (%)</PixelText>
            <input
              type="number"
              className={styles.input}
              value={config.alertThresholds.packetLossCriticalPct}
              onChange={(e) => setConfig({
                ...config,
                alertThresholds: { ...config.alertThresholds, packetLossCriticalPct: parseInt(e.target.value) || 25 },
              })}
            />
          </div>
          <div className={styles.row}>
            <PixelText size="xs">Offline after fails</PixelText>
            <input
              type="number"
              className={styles.input}
              value={config.alertThresholds.offlineAfterFailedPings}
              min={1}
              onChange={(e) => setConfig({
                ...config,
                alertThresholds: { ...config.alertThresholds, offlineAfterFailedPings: parseInt(e.target.value) || 3 },
              })}
            />
          </div>
        </div>

        {/* Scan Performance */}
        <div className={styles.section}>
          <PixelText size="xs" color="secondary">Scan Performance</PixelText>
          <div className={styles.row}>
            <PixelText size="xs">Concurrent Pings</PixelText>
            <input
              type="number"
              className={styles.input}
              value={config.scan.maxConcurrentScanPings}
              min={1}
              max={500}
              onChange={(e) => setConfig({
                ...config,
                scan: { ...config.scan, maxConcurrentScanPings: parseInt(e.target.value) || 200 },
              })}
            />
          </div>
          <div className={styles.row}>
            <PixelText size="xs">Ping Timeout (ms)</PixelText>
            <input
              type="number"
              className={styles.input}
              value={config.scan.scanPingTimeoutMs}
              min={200}
              max={10000}
              onChange={(e) => setConfig({
                ...config,
                scan: { ...config.scan, scanPingTimeoutMs: parseInt(e.target.value) || 1500 },
              })}
            />
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <OoTButton onClick={save}>Save Configuration</OoTButton>
          <OoTButton variant="secondary" onClick={triggerScan} disabled={scanning}>
            {scanning ? 'Scanning...' : 'Scan Now'}
          </OoTButton>
          {saved && <PixelText size="xs" color="highlight">Saved!</PixelText>}
        </div>

        {error && (
          <div className={styles.error}>
            <PixelText size="xs" color="danger">{error}</PixelText>
          </div>
        )}
      </OoTFrame>
    </div>
  );
}
