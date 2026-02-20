import React from 'react';
import { OoTFrame } from '../shared/OoTFrame';
import styles from './GossipStone.module.css';

interface GossipStoneProps {
  children: React.ReactNode;
  visible: boolean;
}

export function GossipStone({ children, visible }: GossipStoneProps) {
  if (!visible) return null;

  return (
    <div className={styles.container}>
      <OoTFrame variant="gossip">
        {children}
      </OoTFrame>
    </div>
  );
}
