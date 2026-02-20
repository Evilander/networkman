import { useEffect, useState, useCallback } from 'react';
import type { Alert } from '@networkman/shared';
import { useAlertStore } from '../../stores/alertStore';
import { useSound } from '../../hooks/useSound';
import { PixelText } from '../shared/PixelText';
import { TypewriterText } from '../shared/TypewriterText';
import styles from './NaviAlert.module.css';

export function NaviAlert() {
  const [currentAlert, setCurrentAlert] = useState<Alert | null>(null);
  const popNaviQueue = useAlertStore((s) => s.popNaviQueue);
  const naviQueue = useAlertStore((s) => s.naviQueue);
  const { play } = useSound();

  const showNext = useCallback(() => {
    const next = popNaviQueue();
    if (next) {
      setCurrentAlert(next);
      if (next.severity === 'critical') {
        play('naviHey');
      } else {
        play('naviWatchOut');
      }
    }
  }, [popNaviQueue, play]);

  useEffect(() => {
    if (!currentAlert && naviQueue.length > 0) {
      showNext();
    }
  }, [naviQueue.length, currentAlert, showNext]);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (!currentAlert) return;
    const timer = setTimeout(() => {
      setCurrentAlert(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [currentAlert]);

  const dismiss = () => {
    // Acknowledge via API
    if (currentAlert) {
      fetch(`/api/alerts/${currentAlert.id}/acknowledge`, { method: 'POST' });
    }
    setCurrentAlert(null);
  };

  if (!currentAlert) return null;

  const isCritical = currentAlert.severity === 'critical';

  return (
    <div className={styles.container} onClick={dismiss}>
      {/* Navi fairy */}
      <div className={`${styles.navi} ${isCritical ? styles.naviUrgent : ''}`}>
        <svg viewBox="0 0 32 32" width="40" height="40" className={styles.naviSprite}>
          {/* Wing left */}
          <ellipse cx="10" cy="14" rx="8" ry="5" fill="rgba(144, 202, 249, 0.4)" transform="rotate(-20 10 14)" />
          {/* Wing right */}
          <ellipse cx="22" cy="14" rx="8" ry="5" fill="rgba(144, 202, 249, 0.4)" transform="rotate(20 22 14)" />
          {/* Body */}
          <ellipse cx="16" cy="16" rx="5" ry="6" fill="var(--oot-blue-navi)" />
          {/* Core glow */}
          <ellipse cx="16" cy="15" rx="3" ry="4" fill="white" opacity="0.6" />
          {/* Eye dots */}
          <circle cx="14" cy="14" r="0.8" fill="#1a1a2e" />
          <circle cx="18" cy="14" r="0.8" fill="#1a1a2e" />
        </svg>
      </div>

      {/* Speech bubble */}
      <div className={`${styles.bubble} ${isCritical ? styles.bubbleCritical : ''}`}>
        <div className={styles.bubbleArrow} />
        <PixelText size="xs" color={isCritical ? 'danger' : 'highlight'}>
          <TypewriterText text={currentAlert.message} speed={30} showCursor={false} />
        </PixelText>
        <PixelText size="xs" color="secondary">
          Click to dismiss
        </PixelText>
      </div>

      {/* Queue indicator */}
      {naviQueue.length > 0 && (
        <div className={styles.queueBadge}>
          +{naviQueue.length}
        </div>
      )}
    </div>
  );
}
