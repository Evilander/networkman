import { useUIStore } from '../../stores/uiStore';
import { useDeviceStore } from '../../stores/deviceStore';
import { OoTFrame } from '../shared/OoTFrame';
import { PixelText } from '../shared/PixelText';
import { OoTButton } from '../shared/OoTButton';
import { SkulltulaCounter } from '../shared/SkulltulaCounter';
import { AlertHistory } from '../alerts/AlertHistory';
import { ItemInventory } from '../inventory/ItemInventory';
import { DeviceDetail } from '../info/DeviceDetail';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const sidebarPanel = useUIStore((s) => s.sidebarPanel);
  const setSidebarPanel = useUIStore((s) => s.setSidebarPanel);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const selectedDeviceId = useDeviceStore((s) => s.selectedDeviceId);

  if (!sidebarOpen) {
    return (
      <button className={styles.openBtn} onClick={toggleSidebar} title="Open sidebar">
        <PixelText size="xs">&#9664;</PixelText>
      </button>
    );
  }

  const activePanel = selectedDeviceId ? 'detail' : sidebarPanel;

  return (
    <div className={styles.sidebar}>
      <OoTFrame variant="inventory" className={styles.frame}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activePanel === 'inventory' ? styles.active : ''}`}
            onClick={() => { useDeviceStore.getState().selectDevice(null); setSidebarPanel('inventory'); }}
          >
            <PixelText size="xs">Items</PixelText>
          </button>
          <button
            className={`${styles.tab} ${activePanel === 'alerts' ? styles.active : ''}`}
            onClick={() => { useDeviceStore.getState().selectDevice(null); setSidebarPanel('alerts'); }}
          >
            <PixelText size="xs">Navi</PixelText>
          </button>
          <button className={styles.closeBtn} onClick={toggleSidebar}>
            <PixelText size="xs">&#9654;</PixelText>
          </button>
        </div>

        {/* Gold Skulltula counter */}
        <div className={styles.skulltulaRow}>
          <SkulltulaCounter />
        </div>

        <div className={styles.panelContent}>
          {activePanel === 'inventory' && <ItemInventory />}
          {activePanel === 'alerts' && <AlertHistory />}
          {activePanel === 'detail' && selectedDeviceId && <DeviceDetail deviceId={selectedDeviceId} />}
        </div>
      </OoTFrame>
    </div>
  );
}
