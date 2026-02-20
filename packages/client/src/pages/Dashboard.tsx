import { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { HyruleMap } from '../components/map/HyruleMap';
import { NaviAlert } from '../components/alerts/NaviAlert';
import { OcarinaConsole } from '../components/console/OcarinaConsole';
import { ItemGetNotification } from '../components/shared/ItemGetNotification';
import { PixelText } from '../components/shared/PixelText';
import styles from './Dashboard.module.css';

export function Dashboard() {
  useWebSocket();
  const [showOcarina, setShowOcarina] = useState(false);

  // Keyboard shortcut: Ctrl+O to open Ocarina Console
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        setShowOcarina((s) => !s);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <DashboardLayout>
      <HyruleMap />
      <NaviAlert />
      <ItemGetNotification />

      {/* Ocarina trigger button */}
      <button
        className={styles.ocarinaBtn}
        onClick={() => setShowOcarina(true)}
        title="Open Ocarina Console (Ctrl+O)"
      >
        <svg viewBox="0 0 40 20" width="32" height="16">
          <ellipse cx="28" cy="10" rx="12" ry="8" fill="var(--oot-blue-navi)" opacity="0.8" />
          <rect x="4" y="6" width="20" height="8" rx="4" fill="var(--oot-brown-medium)" />
          <circle cx="20" cy="8" r="2" fill="var(--oot-gold-dark)" />
          <circle cx="24" cy="12" r="2" fill="var(--oot-gold-dark)" />
          <circle cx="28" cy="8" r="2" fill="var(--oot-gold-dark)" />
        </svg>
        <PixelText size="xs" color="secondary">Ocarina</PixelText>
      </button>

      {showOcarina && <OcarinaConsole onClose={() => setShowOcarina(false)} />}
    </DashboardLayout>
  );
}
