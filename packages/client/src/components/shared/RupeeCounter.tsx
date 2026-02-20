import { useEffect, useState } from 'react';
import styles from './RupeeCounter.module.css';

type RupeeColor = 'green' | 'blue' | 'red';

interface RupeeCounterProps {
  value: number;
  label?: string;
}

function getRupeeColor(value: number): RupeeColor {
  if (value < 100) return 'green';
  if (value < 500) return 'blue';
  return 'red';
}

export function RupeeCounter({ value, label }: RupeeCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [flashing, setFlashing] = useState(false);
  const color = getRupeeColor(value);

  useEffect(() => {
    if (displayValue === value) return;
    setFlashing(true);
    const step = displayValue < value ? 1 : -1;
    const diff = Math.abs(value - displayValue);
    const interval = Math.max(10, Math.min(50, 500 / diff));

    const timer = setInterval(() => {
      setDisplayValue((prev) => {
        if (prev === value) {
          clearInterval(timer);
          setFlashing(false);
          return prev;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.container}>
      <svg className={`${styles.rupee} ${styles[color]}`} viewBox="0 0 20 32" width="12" height="20">
        <polygon points="10,0 20,10 10,32 0,10" />
        <polygon points="10,2 18,10 10,28 2,10" className={styles.inner} />
        <line x1="2" y1="10" x2="18" y2="10" className={styles.shine} />
      </svg>
      <span className={`${styles.value} ${flashing ? styles.flash : ''}`}>
        {displayValue}
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}
