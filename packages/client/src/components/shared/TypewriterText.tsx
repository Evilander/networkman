import { useState, useEffect } from 'react';
import styles from './TypewriterText.module.css';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  showCursor?: boolean;
  className?: string;
}

export function TypewriterText({
  text,
  speed = 40,
  onComplete,
  showCursor = true,
  className = '',
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      if (i >= text.length) {
        setDisplayed(text);
        setDone(true);
        clearInterval(timer);
        onComplete?.();
      } else {
        setDisplayed(text.slice(0, i));
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  return (
    <span className={`${styles.container} ${className}`}>
      {displayed}
      {showCursor && <span className={done ? styles.cursorDone : styles.cursor} />}
    </span>
  );
}
