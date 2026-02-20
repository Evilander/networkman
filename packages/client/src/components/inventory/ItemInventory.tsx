import { useState } from 'react';
import { useDeviceStore } from '../../stores/deviceStore';
import { PixelText } from '../shared/PixelText';
import { OoTFrame } from '../shared/OoTFrame';
import styles from './ItemInventory.module.css';

interface ToolItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  action: () => Promise<void>;
}

export function ItemInventory() {
  const devices = useDeviceStore((s) => s.devices);
  const [hoveredTool, setHoveredTool] = useState<ToolItem | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const stats = {
    online: Array.from(devices.values()).filter((d) => d.status === 'online').length,
    offline: Array.from(devices.values()).filter((d) => d.status === 'offline').length,
    total: devices.size,
  };

  const tools: ToolItem[] = [
    {
      id: 'scan',
      name: 'Net Scan',
      icon: '🗺',
      description: 'Scan the network for new devices (Lens of Truth)',
      action: async () => {
        const res = await fetch('/api/scan', { method: 'POST' });
        const data = await res.json();
        return setResult(`Found ${data.devicesFound} devices, ${data.newDevices} new`);
      },
    },
    {
      id: 'refresh',
      name: 'Refresh',
      icon: '🔄',
      description: 'Request fresh device list (Saria\'s Song)',
      action: async () => {
        const res = await fetch('/api/devices');
        const data = await res.json();
        useDeviceStore.getState().setDevices(data);
        setResult(`Refreshed ${data.length} devices`);
      },
    },
    {
      id: 'clear-alerts',
      name: 'Dismiss',
      icon: '🧚',
      description: 'Acknowledge all alerts (Song of Storms)',
      action: async () => {
        const res = await fetch('/api/alerts/acknowledge-all', { method: 'POST' });
        const data = await res.json();
        setResult(`Dismissed ${data.acknowledged} alerts`);
      },
    },
    {
      id: 'summary',
      name: 'Summary',
      icon: '📊',
      description: 'Network metrics summary (Gossip Stone)',
      action: async () => {
        const res = await fetch('/api/metrics/summary');
        const data = await res.json();
        setResult(`${data.totalDevices} active, avg ${Math.round(data.avgLatency ?? 0)}ms, ${Math.round(data.avgPacketLoss)}% loss`);
      },
    },
  ];

  const runTool = async (tool: ToolItem) => {
    setRunning(tool.id);
    setResult(null);
    try {
      await tool.action();
    } catch {
      setResult('Failed!');
    }
    setRunning(null);
  };

  return (
    <div className={styles.container}>
      <PixelText size="xs" color="highlight">Equipment</PixelText>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <PixelText size="xs" color="secondary">Online</PixelText>
          <PixelText size="sm" color="highlight">{stats.online}</PixelText>
        </div>
        <div className={styles.stat}>
          <PixelText size="xs" color="secondary">Offline</PixelText>
          <PixelText size="sm" color="danger">{stats.offline}</PixelText>
        </div>
        <div className={styles.stat}>
          <PixelText size="xs" color="secondary">Total</PixelText>
          <PixelText size="sm" color="primary">{stats.total}</PixelText>
        </div>
      </div>

      {/* Tool grid */}
      <div className={styles.grid}>
        {tools.map((tool) => (
          <button
            key={tool.id}
            className={`${styles.slot} ${running === tool.id ? styles.running : ''}`}
            onClick={() => runTool(tool)}
            onMouseEnter={() => setHoveredTool(tool)}
            onMouseLeave={() => setHoveredTool(null)}
            disabled={running !== null}
          >
            <span className={styles.toolIcon}>{tool.icon}</span>
            <PixelText size="xs">{tool.name}</PixelText>
          </button>
        ))}
      </div>

      {/* Description bar */}
      {hoveredTool && (
        <OoTFrame variant="gossip" className={styles.descBar}>
          <PixelText size="xs" color="secondary">{hoveredTool.description}</PixelText>
        </OoTFrame>
      )}

      {/* Result display */}
      {result && (
        <div className={styles.result}>
          <PixelText size="xs" color="highlight">{result}</PixelText>
        </div>
      )}
    </div>
  );
}
