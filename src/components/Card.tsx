import styles from './Card.module.css';

export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`${styles.card} ${className}`}>{children}</div>;
}

export function CardHeader({ title, action }: { title: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className={styles.cardHeader}>
      <h2 className={styles.cardTitle}>{title}</h2>
      {action}
    </div>
  );
}
