import { useAlertStore } from '../../stores/alertStore';
import { PixelText } from './PixelText';
import styles from './SkulltulaCounter.module.css';

/** Gold Skulltula SVG icon */
function SkulltulaIcon() {
  return (
    <svg className={styles.spider} viewBox="0 0 32 32">
      {/* Body */}
      <ellipse cx="16" cy="18" rx="8" ry="10" fill="#c9a227" />
      {/* Skull pattern */}
      <circle cx="12" cy="15" r="2.5" fill="#1a1a2e" />
      <circle cx="20" cy="15" r="2.5" fill="#1a1a2e" />
      <ellipse cx="16" cy="20" rx="2" ry="1.5" fill="#1a1a2e" />
      {/* Legs */}
      <line x1="8" y1="14" x2="2" y2="10" stroke="#8b6914" strokeWidth="1.5" />
      <line x1="8" y1="18" x2="1" y2="20" stroke="#8b6914" strokeWidth="1.5" />
      <line x1="8" y1="22" x2="2" y2="26" stroke="#8b6914" strokeWidth="1.5" />
      <line x1="24" y1="14" x2="30" y2="10" stroke="#8b6914" strokeWidth="1.5" />
      <line x1="24" y1="18" x2="31" y2="20" stroke="#8b6914" strokeWidth="1.5" />
      <line x1="24" y1="22" x2="30" y2="26" stroke="#8b6914" strokeWidth="1.5" />
      {/* Thread */}
      <line x1="16" y1="8" x2="16" y2="0" stroke="#c9a227" strokeWidth="1" opacity="0.5" />
      {/* Gold highlight */}
      <ellipse cx="14" cy="13" rx="1" ry="1.5" fill="#f4d03f" opacity="0.4" />
    </svg>
  );
}

export function SkulltulaCounter() {
  const alerts = useAlertStore((s) => s.alerts);
  const unacked = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className={styles.container}>
      <SkulltulaIcon />
      <div>
        <span className={unacked === 0 ? styles.countZero : styles.count}>
          {unacked}
        </span>
        <PixelText size="xs" color="secondary"> tokens</PixelText>
      </div>
    </div>
  );
}
