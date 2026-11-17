import { createElement, type ReactNode } from 'react';
import styles from './PixelText.module.css';

interface PixelTextProps {
  children: ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'highlight' | 'danger';
  as?: keyof HTMLElementTagNameMap;
  className?: string;
}

export function PixelText({ children, size = 'sm', color = 'primary', as: Tag = 'span', className = '' }: PixelTextProps) {
  return createElement(
    Tag,
    { className: `${styles.text} ${styles[`size_${size}`]} ${styles[`color_${color}`]} ${className}` },
    children,
  );
}
