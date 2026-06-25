import type { ReactNode } from 'react';
import { HUDOverlay } from './HUDOverlay';
import { Sidebar } from './Sidebar';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className={styles.layout}>
      <HUDOverlay />
      <div className={styles.main}>
        <div className={styles.content}>
          {children}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
