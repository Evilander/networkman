import { useMemo } from 'react';
import { Heart } from './Heart';
import styles from './HeartContainer.module.css';

interface HeartContainerProps {
  heartCount: number;
  maxHearts?: number;
}

export function HeartContainer({ heartCount, maxHearts = 10 }: HeartContainerProps) {
  const hearts = useMemo(() => {
    const result: Array<'full' | 'half' | 'empty'> = [];
    for (let i = 0; i < maxHearts; i++) {
      if (i < Math.floor(heartCount)) result.push('full');
      else if (i < heartCount) result.push('half');
      else result.push('empty');
    }
    return result;
  }, [heartCount, maxHearts]);

  const isCritical = heartCount <= 2 && heartCount > 0;

  return (
    <div className={styles.container}>
      {hearts.map((state, i) => (
        <Heart key={i} state={state} critical={isCritical && state !== 'empty'} />
      ))}
    </div>
  );
}
