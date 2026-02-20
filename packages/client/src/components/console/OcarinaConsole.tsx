import { useState } from 'react';
import { useDeviceStore } from '../../stores/deviceStore';
import { useAlertStore } from '../../stores/alertStore';
import { OoTFrame } from '../shared/OoTFrame';
import { PixelText } from '../shared/PixelText';
import { TypewriterText } from '../shared/TypewriterText';
import styles from './OcarinaConsole.module.css';

// OoT note colors matching the N64 C-buttons and A button
const NOTE_COLORS: Record<string, string> = {
  'A': '#42a5f5',  // A button - blue
  'v': '#ffd700',  // C-down - yellow
  '^': '#ffd700',  // C-up - yellow
  '<': '#ffd700',  // C-left - yellow
  '>': '#ffd700',  // C-right - yellow
};

function NoteDisplay({ notes }: { notes: string }) {
  const parts = notes.split(' ');
  return (
    <div className={styles.noteButtons}>
      {parts.map((note, i) => (
        <span
          key={i}
          className={styles.noteBtn}
          style={{ background: NOTE_COLORS[note] ?? '#888', animationDelay: `${i * 0.1}s` }}
        >
          {note}
        </span>
      ))}
    </div>
  );
}

interface Song {
  id: string;
  name: string;
  notes: string;
  description: string;
  color: string;
  action: () => Promise<string>;
}

interface OcarinaConsoleProps {
  onClose: () => void;
}

export function OcarinaConsole({ onClose }: OcarinaConsoleProps) {
  const [result, setResult] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [playedSong, setPlayedSong] = useState<string | null>(null);

  const songs: Song[] = [
    {
      id: 'lullaby',
      name: "Zelda's Lullaby",
      notes: '< ^ > < ^ >',
      description: 'Full network scan',
      color: '#9c27b0',
      action: async () => {
        const res = await fetch('/api/scan', { method: 'POST' });
        if (!res.ok) {
          const err = await res.json();
          return err.error || 'Scan failed!';
        }
        const data = await res.json();
        return `Scan complete! Found ${data.devicesFound} devices (${data.newDevices} new)`;
      },
    },
    {
      id: 'sarias',
      name: "Saria's Song",
      notes: 'v > < v > <',
      description: 'Refresh all devices',
      color: '#4caf50',
      action: async () => {
        const res = await fetch('/api/devices');
        const data = await res.json();
        useDeviceStore.getState().setDevices(data);
        return `Refreshed ${data.length} devices from the Sacred Forest Meadow`;
      },
    },
    {
      id: 'storms',
      name: 'Song of Storms',
      notes: 'A v ^ A v ^',
      description: 'Clear all alerts',
      color: '#607d8b',
      action: async () => {
        const res = await fetch('/api/alerts/acknowledge-all', { method: 'POST' });
        const data = await res.json();
        useAlertStore.getState().clearNaviQueue();
        return `The storm has passed. ${data.acknowledged} alerts cleared.`;
      },
    },
    {
      id: 'time',
      name: 'Song of Time',
      notes: '> A v > A v',
      description: 'View metrics summary',
      color: '#2196f3',
      action: async () => {
        const res = await fetch('/api/metrics/summary');
        const data = await res.json();
        return `${data.totalDevices} devices monitored. Avg latency: ${Math.round(data.avgLatency ?? 0)}ms. Packet loss: ${Math.round(data.avgPacketLoss)}%`;
      },
    },
    {
      id: 'epona',
      name: "Epona's Song",
      notes: '^ < > ^ < >',
      description: 'Export device list',
      color: '#ff9800',
      action: async () => {
        const res = await fetch('/api/devices');
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `networkman-devices-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        return `Exported ${data.length} devices. Epona delivered the data!`;
      },
    },
    {
      id: 'sun',
      name: "Sun's Song",
      notes: '> v ^ > v ^',
      description: 'Toggle sound on/off',
      color: '#ffeb3b',
      action: async () => {
        const { useUIStore } = await import('../../stores/uiStore');
        useUIStore.getState().toggleSound();
        const enabled = useUIStore.getState().soundEnabled;
        return enabled ? 'The sun rises! Sound enabled.' : 'Night falls... Sound muted.';
      },
    },
    {
      id: 'minuet',
      name: 'Minuet of Forest',
      notes: 'A ^ < > < >',
      description: 'Show healthy devices only',
      color: '#66bb6a',
      action: async () => {
        const res = await fetch('/api/devices');
        const data = await res.json();
        const healthy = data.filter((d: { heartCount: number }) => d.heartCount >= 8);
        return `${healthy.length} devices in the Sacred Forest Meadow are thriving (8+ hearts)`;
      },
    },
    {
      id: 'prelude',
      name: 'Prelude of Light',
      notes: '^ > ^ > < ^',
      description: 'Ping all offline devices',
      color: '#fdd835',
      action: async () => {
        const res = await fetch('/api/devices');
        const data = await res.json();
        const offline = data.filter((d: { status: string }) => d.status === 'offline');
        for (const d of offline) {
          await fetch(`/api/devices/${d.id}/ping`, { method: 'POST' });
        }
        return `Light shines on ${offline.length} lost devices. Pinging them now...`;
      },
    },
  ];

  const playSong = async (song: Song) => {
    setRunning(true);
    setResult(null);
    setPlayedSong(song.id);
    try {
      const msg = await song.action();
      setResult(msg);
    } catch {
      setResult('The song failed... dark magic interferes!');
    }
    setRunning(false);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.console} onClick={(e) => e.stopPropagation()}>
        <OoTFrame variant="dialog">
          <div className={styles.header}>
            <PixelText size="md" color="highlight">Ocarina of Network</PixelText>
            <button className={styles.closeBtn} onClick={onClose}>
              <PixelText size="xs">X</PixelText>
            </button>
          </div>

          {/* Ocarina visual */}
          <div className={styles.ocarinaVisual}>
            <svg viewBox="0 0 120 40" width="100" height="33">
              <ellipse cx="85" cy="20" rx="30" ry="16" fill="var(--oot-blue-navi)" opacity="0.6" />
              <rect x="10" y="12" width="55" height="16" rx="8" fill="var(--oot-brown-medium)" />
              <circle cx="50" cy="16" r="3.5" fill="var(--oot-gold-dark)" />
              <circle cx="60" cy="24" r="3.5" fill="var(--oot-gold-dark)" />
              <circle cx="72" cy="16" r="3.5" fill="var(--oot-gold-dark)" />
              <circle cx="82" cy="24" r="3.5" fill="var(--oot-gold-dark)" />
              <circle cx="92" cy="16" r="3.5" fill="var(--oot-gold-dark)" />
            </svg>
          </div>

          <div className={styles.songList}>
            {songs.map((song) => (
              <button
                key={song.id}
                className={`${styles.songRow} ${playedSong === song.id ? styles.songActive : ''}`}
                onClick={() => playSong(song)}
                disabled={running}
                style={{ '--song-color': song.color } as React.CSSProperties}
              >
                <div className={styles.songInfo}>
                  <PixelText size="xs" color="highlight">{song.name}</PixelText>
                  <PixelText size="xs" color="secondary">{song.description}</PixelText>
                </div>
                <NoteDisplay notes={song.notes} />
              </button>
            ))}
          </div>

          {result && (
            <div className={styles.result}>
              <PixelText size="xs" color="highlight">
                <TypewriterText text={result} speed={25} showCursor={false} />
              </PixelText>
            </div>
          )}
        </OoTFrame>
      </div>
    </div>
  );
}
