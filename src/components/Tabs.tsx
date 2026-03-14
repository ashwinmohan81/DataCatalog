import styles from './Tabs.module.css';

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className={styles.tabs}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          className={active === t.id ? styles.active : ''}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
