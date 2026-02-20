import { useState, useEffect, useMemo } from 'react';
import styles from './TitleScreen.module.css';

interface TitleScreenProps {
  onDismiss: () => void;
}

export function TitleScreen({ onDismiss }: TitleScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);
  const [ready, setReady] = useState(false);

  // Generate random stars
  const stars = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
      size: 1 + Math.random() * 2,
    })),
  []);

  useEffect(() => {
    // Show "Press any key" after a short delay
    const timer = setTimeout(() => setReady(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const handler = () => {
      setFadeOut(true);
      setTimeout(onDismiss, 1200);
    };
    window.addEventListener('keydown', handler);
    window.addEventListener('click', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('click', handler);
    };
  }, [ready, onDismiss]);

  return (
    <div className={`${styles.overlay} ${fadeOut ? styles.fadeOut : ''}`}>
      {/* Starfield */}
      <div className={styles.stars}>
        {stars.map((star) => (
          <div
            key={star.id}
            className={styles.star}
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      <div className={styles.content}>
        <span className={styles.subtitle}>The Legend of Zelda</span>

        {/* Triforce */}
        <div className={styles.triforce}>
          <svg viewBox="0 0 120 110" width="140" height="128">
            <polygon className={`${styles.triPiece} ${styles.triTop}`} points="60,5 90,52 30,52" />
            <polygon className={`${styles.triPiece} ${styles.triLeft}`} points="30,58 60,105 0,105" />
            <polygon className={`${styles.triPiece} ${styles.triRight}`} points="90,58 120,105 60,105" />
          </svg>
        </div>

        <div className={styles.title}>
          NETWORK
          <span className={styles.titleAccent}>MANAGER</span>
        </div>

        {ready && (
          <span className={styles.prompt}>Press any key</span>
        )}
      </div>

      <span className={styles.copyright}>Hyrule IT Dept.</span>
      <span className={styles.version}>v1.0.0</span>
    </div>
  );
}
