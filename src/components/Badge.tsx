import styles from './Badge.module.css';

type Variant = 'default' | 'success' | 'warning' | 'error' | 'info';

export function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: Variant;
}) {
  return <span className={`${styles.badge} ${styles[variant]}`}>{children}</span>;
}
