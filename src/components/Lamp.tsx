import styles from './Lamp.module.css'

export function Lamp({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button className={styles.lamp} type="button" aria-label="Luz de la lámpara" aria-pressed={on} onClick={onToggle}>
      <span className={styles.glow} aria-hidden="true" />
      <span className={styles.label}>{on ? 'Apagar luz' : 'Encender luz'} <span aria-hidden="true">↗</span></span>
    </button>
  )
}
