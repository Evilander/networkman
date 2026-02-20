import { useEffect, useState, useCallback, useRef } from 'react';
import { useDeviceStore } from '../../stores/deviceStore';
import { useSound } from '../../hooks/useSound';
import { OoTFrame } from './OoTFrame';
import { PixelText } from './PixelText';
import { TypewriterText } from './TypewriterText';
import styles from './ItemGetNotification.module.css';

interface DiscoveryItem {
  name: string;
  ip: string;
}

export function ItemGetNotification() {
  const [current, setCurrent] = useState<DiscoveryItem | null>(null);
  const [queue, setQueue] = useState<DiscoveryItem[]>([]);
  const { play } = useSound();

  // Listen for new device discoveries
  const devices = useDeviceStore((s) => s.devices);
  const prevCountRef = useRef(devices.size);

  useEffect(() => {
    const prevCount = prevCountRef.current;
    if (devices.size > prevCount) {
      // Find the newest devices
      const all = Array.from(devices.values());
      const newOnes = all.slice(prevCount).map((d) => ({ name: d.name, ip: d.ip }));
      if (newOnes.length > 0 && newOnes.length <= 5) {
        // Only show item-get for small batches (not initial bulk load)
        setQueue((q) => [...q, ...newOnes]);
      }
    }
    prevCountRef.current = devices.size;
  }, [devices.size]);

  // Show next from queue
  useEffect(() => {
    if (!current && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrent(next);
      setQueue(rest);
      play('itemGet');
    }
  }, [current, queue, play]);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => setCurrent(null), 4000);
    return () => clearTimeout(timer);
  }, [current]);

  const dismiss = useCallback(() => setCurrent(null), []);

  if (!current) return null;

  return (
    <div className={styles.overlay} onClick={dismiss}>
      <div className={styles.content}>
        {/* Device icon rising up */}
        <div className={styles.iconWrapper}>
          <svg className={styles.icon} viewBox="0 0 64 64">
            {/* Monitor/Server icon */}
            <rect x="12" y="8" width="40" height="30" rx="3" fill="var(--oot-bg-panel)" stroke="var(--oot-gold-medium)" strokeWidth="2" />
            <rect x="16" y="12" width="32" height="22" fill="var(--oot-green-dark)" />
            <line x1="20" y1="18" x2="44" y2="18" stroke="var(--oot-green-light)" strokeWidth="2" />
            <line x1="20" y1="24" x2="36" y2="24" stroke="var(--oot-green-light)" strokeWidth="1" opacity="0.6" />
            <line x1="20" y1="28" x2="40" y2="28" stroke="var(--oot-green-light)" strokeWidth="1" opacity="0.4" />
            <rect x="28" y="38" width="8" height="6" fill="var(--oot-gold-dark)" />
            <rect x="20" y="44" width="24" height="4" rx="1" fill="var(--oot-gold-dark)" />
            {/* Status LED */}
            <circle cx="42" cy="14" r="2" fill="var(--oot-green-light)" />
          </svg>
        </div>

        {/* Text */}
        <OoTFrame variant="dialog">
          <div className={styles.fanfare}>
            <PixelText size="md" color="highlight">You discovered a device!</PixelText>
            <PixelText size="sm" color="primary">
              <TypewriterText text={`${current.name} (${current.ip})`} speed={25} showCursor={false} />
            </PixelText>
            <PixelText size="xs" color="secondary">
              It has been added to your map.
            </PixelText>
          </div>
        </OoTFrame>

        <span className={styles.dismiss}>Click to dismiss</span>
      </div>
    </div>
  );
}
