import { useMemo, useState, useEffect } from 'react';
import { useDeviceStore } from '../../stores/deviceStore';
import { useAlertStore } from '../../stores/alertStore';
import { useUIStore } from '../../stores/uiStore';
import { RupeeCounter } from '../shared/RupeeCounter';
import { PixelText } from '../shared/PixelText';
import styles from './HUDOverlay.module.css';

function HeartIcon({ filled }: { filled: 'full' | 'half' | 'empty' }) {
  const colors = {
    full: 'var(--oot-red-heart)',
    half: 'var(--oot-red-heart)',
    empty: 'var(--oot-red-dark)',
  };
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" className={styles.heartIcon}>
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={colors[filled]}
        opacity={filled === 'empty' ? 0.3 : filled === 'half' ? 0.6 : 1}
      />
    </svg>
  );
}

/** OoT-style button indicator */
function HUDButton({ label, color, sublabel, onClick }: {
  label: string;
  color: string;
  sublabel: string;
  onClick?: () => void;
}) {
  return (
    <button className={styles.hudButton} onClick={onClick} title={sublabel}>
      <div className={styles.hudButtonCircle} style={{ background: color }}>
        <span className={styles.hudButtonLabel}>{label}</span>
      </div>
      <PixelText size="xs" color="secondary">{sublabel}</PixelText>
    </button>
  );
}

/** Real-time clock showing Hyrule Time */
function HyruleTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const period = hours >= 6 && hours < 18 ? 'Day' : 'Night';
  const icon = period === 'Day' ? '\u2600' : '\u263E'; // sun : moon

  return (
    <div className={styles.timeDisplay}>
      <span className={styles.timeIcon}>{icon}</span>
      <PixelText size="xs" color="secondary">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {period}
      </PixelText>
    </div>
  );
}

export function HUDOverlay() {
  const devices = useDeviceStore((s) => s.devices);
  const alerts = useAlertStore((s) => s.alerts);
  const scanProgress = useUIStore((s) => s.scanProgress);
  const soundEnabled = useUIStore((s) => s.soundEnabled);
  const toggleSound = useUIStore((s) => s.toggleSound);
  const setSidebarPanel = useUIStore((s) => s.setSidebarPanel);

  const stats = useMemo(() => {
    const all = Array.from(devices.values());
    const online = all.filter((d) => d.status === 'online').length;
    const degraded = all.filter((d) => d.status === 'degraded').length;
    const offline = all.filter((d) => d.status === 'offline').length;
    const total = all.length;

    // Average health as hearts out of 10
    const avgHealth = total > 0
      ? Math.round(all.reduce((sum, d) => sum + d.heartCount, 0) / total)
      : 10;

    // Unacknowledged alerts
    const unacked = alerts.filter((a) => !a.acknowledged).length;

    return { online, degraded, offline, total, avgHealth, unacked };
  }, [devices, alerts]);

  const hearts = useMemo(() => {
    const result: Array<'full' | 'half' | 'empty'> = [];
    const count = stats.avgHealth;
    for (let i = 0; i < 10; i++) {
      if (i < Math.floor(count)) result.push('full');
      else if (i < count) result.push('half');
      else result.push('empty');
    }
    return result;
  }, [stats.avgHealth]);

  const isCritical = stats.avgHealth <= 3;

  return (
    <div className={`${styles.hud} ${isCritical ? styles.hudCritical : ''}`}>
      {/* Hearts - Network Health */}
      <div className={styles.section}>
        <div className={`${styles.heartsRow} ${isCritical ? styles.heartsCritical : ''}`}>
          {hearts.map((state, i) => (
            <HeartIcon key={i} filled={state} />
          ))}
        </div>
        <PixelText size="xs" color={isCritical ? 'danger' : 'secondary'}>
          {isCritical ? 'WARNING!' : 'Network Health'}
        </PixelText>
      </div>

      {/* Center - Status + Time */}
      <div className={styles.center}>
        <PixelText size="md" color="highlight">HYRULE NETWORK</PixelText>
        <div className={styles.statusRow}>
          <span className={styles.statusOnline}>{stats.online}</span>
          <span className={styles.statusDegraded}>{stats.degraded}</span>
          <span className={styles.statusOffline}>{stats.offline}</span>
          <PixelText size="xs" color="secondary"> / {stats.total} devices</PixelText>
        </div>
        {scanProgress && (
          <div className={styles.scanInfo}>
            <div className={styles.scanBar}>
              <div
                className={styles.scanFill}
                style={{ width: `${(scanProgress.scanned / scanProgress.total) * 100}%` }}
              />
              <PixelText size="xs">
                {Math.round((scanProgress.scanned / scanProgress.total) * 100)}% — {scanProgress.found} found
              </PixelText>
            </div>
            <PixelText size="xs" color="secondary">
              {scanProgress.scanned}/{scanProgress.total} hosts
              {scanProgress.estimatedRemaining > 0 && ` — ~${Math.round(scanProgress.estimatedRemaining / 1000)}s left`}
            </PixelText>
            <button
              className={styles.abortBtn}
              onClick={() => fetch('/api/scan/abort', { method: 'POST' })}
            >
              <PixelText size="xs" color="danger">Abort</PixelText>
            </button>
          </div>
        )}
        <HyruleTime />
      </div>

      {/* Right - Rupees, Buttons, Controls */}
      <div className={styles.rightSection}>
        <RupeeCounter value={stats.total} label="devices" />

        {/* C-Button Quick Actions */}
        <div className={styles.cButtons}>
          <HUDButton
            label="C"
            color="#ffd700"
            sublabel="Scan"
            onClick={() => fetch('/api/scan', { method: 'POST' })}
          />
          <HUDButton
            label="C"
            color="#ffd700"
            sublabel="Alerts"
            onClick={() => setSidebarPanel('alerts')}
          />
          <HUDButton
            label="C"
            color="#ffd700"
            sublabel="Items"
            onClick={() => setSidebarPanel('inventory')}
          />
        </div>

        <div className={styles.controls}>
          {/* Navi alert indicator */}
          {stats.unacked > 0 && (
            <div className={styles.naviIndicator}>
              <span className={styles.naviBadge}>{stats.unacked}</span>
            </div>
          )}
          {/* A/B buttons */}
          <div className={styles.abButtons}>
            <button className={styles.aButton} onClick={() => setSidebarPanel('inventory')}>
              <span>A</span>
            </button>
            <button className={styles.bButton} onClick={toggleSound}>
              <span>B</span>
            </button>
          </div>
          <button className={styles.soundToggle} onClick={toggleSound} title={soundEnabled ? 'Mute' : 'Unmute'}>
            {soundEnabled ? '\uD83D\uDD0A' : '\uD83D\uDD07'}
          </button>
        </div>
      </div>
    </div>
  );
}
