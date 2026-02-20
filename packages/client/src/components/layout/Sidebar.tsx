import { useUIStore } from '../../stores/uiStore';
import { useDeviceStore } from '../../stores/deviceStore';
import { OoTFrame } from '../shared/OoTFrame';
import { PixelText } from '../shared/PixelText';
import { SkulltulaCounter } from '../shared/SkulltulaCounter';
import { AlertHistory } from '../alerts/AlertHistory';
import { ItemInventory } from '../inventory/ItemInventory';
import { DeviceDetail } from '../info/DeviceDetail';
import { Settings } from '../../pages/Settings';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const sidebarPanel = useUIStore((s) => s.sidebarPanel);
  const setSidebarPanel = useUIStore((s) => s.setSidebarPanel);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const selectedDeviceId = useDeviceStore((s) => s.selectedDeviceId);
  const selectDevice = useDeviceStore((s) => s.selectDevice);

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
            onClick={() => { selectDevice(null); setSidebarPanel('inventory'); }}
          >
            <PixelText size="xs">Items</PixelText>
          </button>
          <button
            className={`${styles.tab} ${activePanel === 'alerts' ? styles.active : ''}`}
            onClick={() => { selectDevice(null); setSidebarPanel('alerts'); }}
          >
            <PixelText size="xs">Navi</PixelText>
          </button>
          <button
            className={`${styles.tab} ${activePanel === 'settings' ? styles.active : ''}`}
            onClick={() => { selectDevice(null); setSidebarPanel('settings'); }}
          >
            <PixelText size="xs">Config</PixelText>
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
          {activePanel === 'settings' && <Settings />}
          {activePanel === 'detail' && selectedDeviceId && <DeviceDetail deviceId={selectedDeviceId} />}
        </div>
      </OoTFrame>
    </div>
  );
}
