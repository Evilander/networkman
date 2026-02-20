import { useEffect, useState } from 'react';
import type { DashboardConfig } from '@networkman/shared';
import { OoTFrame } from '../components/shared/OoTFrame';
import { PixelText } from '../components/shared/PixelText';
import { OoTButton } from '../components/shared/OoTButton';
import styles from './Settings.module.css';

const PRESET_SUBNETS = [
  { cidr: '10.101.91.0/24', label: 'Office (10.101.91.x)' },
  { cidr: '192.168.1.0/24', label: 'Home (192.168.1.x)' },
  { cidr: '192.168.0.0/24', label: 'Home (192.168.0.x)' },
  { cidr: '10.0.0.0/24', label: 'Private (10.0.0.x)' },
  { cidr: '172.16.0.0/24', label: 'Private (172.16.0.x)' },
];

export function Settings() {
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setError('Failed to load configuration'));
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

  const applyPreset = (cidr: string, label: string) => {
    if (!config) return;
    const next = [...config.subnets];
    next[0] = { cidr, label, enabled: true };
    setConfig({ ...config, subnets: next });
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

  if (!config) {
    return (
      <div className={styles.container}>
        {error ? (
          <PixelText size="xs" color="danger">{error}</PixelText>
        ) : (
          <PixelText size="sm">Loading config...</PixelText>
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PixelText size="sm" color="highlight">Configuration</PixelText>

      {/* Quick start hint */}
      <div className={styles.hint}>
        <PixelText size="xs" color="secondary">
          Pick a preset or type your own subnet, then Save and Scan.
        </PixelText>
      </div>

      {/* Preset quick-pick buttons */}
      <div className={styles.section}>
        <PixelText size="xs" color="secondary">Quick Presets</PixelText>
        <div className={styles.presetGrid}>
          {PRESET_SUBNETS.map((p) => (
            <button
              key={p.cidr}
              className={`${styles.presetBtn} ${config.subnets[0]?.cidr === p.cidr ? styles.presetActive : ''}`}
              onClick={() => applyPreset(p.cidr, p.label)}
            >
              <PixelText size="xs">{p.label}</PixelText>
            </button>
          ))}
        </div>
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
              <input
                className={styles.inputWide}
                value={subnet.cidr}
                placeholder="10.0.0.0/24"
                onChange={(e) => {
                  const next = [...config.subnets];
                  next[i] = { ...next[i], cidr: e.target.value };
                  setConfig({ ...config, subnets: next });
                }}
              />
              <input
                className={styles.inputWide}
                value={subnet.label}
                placeholder="My Network"
                onChange={(e) => {
                  const next = [...config.subnets];
                  next[i] = { ...next[i], label: e.target.value };
                  setConfig({ ...config, subnets: next });
                }}
              />
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
          <PixelText size="xs">Scan (sec)</PixelText>
          <input
            type="number"
            className={styles.inputSmall}
            value={config.scanIntervalSeconds}
            min={10}
            onChange={(e) => setConfig({ ...config, scanIntervalSeconds: parseInt(e.target.value) || 300 })}
          />
        </div>
        <div className={styles.row}>
          <PixelText size="xs">Health (sec)</PixelText>
          <input
            type="number"
            className={styles.inputSmall}
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
          <PixelText size="xs">Latency Warn</PixelText>
          <input
            type="number"
            className={styles.inputSmall}
            value={config.alertThresholds.latencyWarningMs}
            onChange={(e) => setConfig({
              ...config,
              alertThresholds: { ...config.alertThresholds, latencyWarningMs: parseInt(e.target.value) || 100 },
            })}
          />
        </div>
        <div className={styles.row}>
          <PixelText size="xs">Latency Crit</PixelText>
          <input
            type="number"
            className={styles.inputSmall}
            value={config.alertThresholds.latencyCriticalMs}
            onChange={(e) => setConfig({
              ...config,
              alertThresholds: { ...config.alertThresholds, latencyCriticalMs: parseInt(e.target.value) || 500 },
            })}
          />
        </div>
        <div className={styles.row}>
          <PixelText size="xs">Loss Warn %</PixelText>
          <input
            type="number"
            className={styles.inputSmall}
            value={config.alertThresholds.packetLossWarningPct}
            onChange={(e) => setConfig({
              ...config,
              alertThresholds: { ...config.alertThresholds, packetLossWarningPct: parseInt(e.target.value) || 5 },
            })}
          />
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <OoTButton size="sm" onClick={save}>Save</OoTButton>
        <OoTButton size="sm" variant="secondary" onClick={triggerScan} disabled={scanning}>
          {scanning ? 'Scanning...' : 'Scan Now'}
        </OoTButton>
      </div>
      {saved && (
        <div className={styles.savedMsg}>
          <PixelText size="xs" color="highlight">Saved!</PixelText>
        </div>
      )}
      {error && (
        <div className={styles.error}>
          <PixelText size="xs" color="danger">{error}</PixelText>
        </div>
      )}
    </div>
  );
}
