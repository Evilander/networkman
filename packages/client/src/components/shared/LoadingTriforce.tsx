import styles from './LoadingTriforce.module.css';

interface LoadingTriforceProps {
  text?: string;
}

export function LoadingTriforce({ text = 'Loading...' }: LoadingTriforceProps) {
  return (
    <div className={styles.container}>
      <svg className={styles.triforce} viewBox="0 0 100 90" width="80" height="72">
        <polygon className={styles.top} points="50,5 75,45 25,45" />
        <polygon className={styles.left} points="25,48 50,88 0,88" />
        <polygon className={styles.right} points="75,48 100,88 50,88" />
      </svg>
      <span className={styles.text}>{text}</span>
    </div>
  );
}
