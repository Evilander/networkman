import { PixelText } from '../shared/PixelText';
import styles from './MapLegend.module.css';

export function MapLegend() {
  return (
    <div className={styles.legend}>
      <div className={styles.item}>
        <span className={`${styles.dot} ${styles.online}`} />
        <PixelText size="xs" color="secondary">Online</PixelText>
      </div>
      <div className={styles.item}>
        <span className={`${styles.dot} ${styles.degraded}`} />
        <PixelText size="xs" color="secondary">Degraded</PixelText>
      </div>
      <div className={styles.item}>
        <span className={`${styles.dot} ${styles.offline}`} />
        <PixelText size="xs" color="secondary">Offline</PixelText>
      </div>
      <div className={styles.item}>
        <span className={`${styles.dot} ${styles.unknown}`} />
        <PixelText size="xs" color="secondary">Unknown</PixelText>
      </div>
    </div>
  );
}
