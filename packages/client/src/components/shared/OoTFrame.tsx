import React from 'react';
import styles from './OoTFrame.module.css';

interface OoTFrameProps {
  children: React.ReactNode;
  variant?: 'dialog' | 'inventory' | 'hud' | 'gossip';
  className?: string;
}

export function OoTFrame({ children, variant = 'dialog', className = '' }: OoTFrameProps) {
  return (
    <div className={`${styles.frame} ${styles[variant]} ${className}`}>
      <div className={styles.cornerTL} />
      <div className={styles.cornerTR} />
      <div className={styles.cornerBL} />
      <div className={styles.cornerBR} />
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
