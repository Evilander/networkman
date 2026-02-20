import React from 'react';
import styles from './OoTButton.module.css';

interface OoTButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
}

export function OoTButton({ variant = 'primary', size = 'md', className = '', children, ...props }: OoTButtonProps) {
  return (
    <button
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`}
      {...props}
    >
      <span className={styles.cursor}>&#9654;</span>
      {children}
    </button>
  );
}
