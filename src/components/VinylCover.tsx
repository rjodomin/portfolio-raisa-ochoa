import type { CSSProperties } from 'react'
import type { PortfolioRecord } from '../data/records'
import { sleevePlacement } from '../data/scene'
import styles from './RecordShelf.module.css'

const artwork = import.meta.glob('../assets/sleeve-*.webp', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>

type Props = {
  record: PortfolioRecord
  selected: boolean
  onSelect: (record: PortfolioRecord) => void
}

export function VinylCover({ record, selected, onSelect }: Props) {
  const placement = sleevePlacement[record.id]
  const style = {
    left: `${placement.x}%`, top: `${placement.y}%`,
    width: `${placement.width}%`, height: `${placement.height}%`,
    '--ink': record.ink, '--sleeve-clip': placement.clip,
  } as CSSProperties

  return (
    <button id={`record-${record.id}`} type="button"
      className={`${styles.cover} ${selected ? styles.selected : ''}`}
      style={style} aria-pressed={selected}
      aria-label={`Seleccionar ${record.title}`} onClick={() => onSelect(record)}>
      <img className={styles.sleeve} src={artwork[`../assets/sleeve-${record.id}.webp`]} alt="" draggable="false" />
      {(['day', 'cloudy', 'night'] as const).map(variant => (
        <img
          key={variant}
          className={`${styles.sleeve} ${styles[variant]}`}
          src={artwork[`../assets/sleeve-${variant}-${record.id}.webp`]}
          alt="" draggable="false" decoding="async"
        />
      ))}
      <span className={styles.caption}>
        <span className={styles.number}>{record.number}</span>
        <span className={styles.title}>{record.title}</span>
      </span>
      <span className={styles.arrow} aria-hidden="true">{selected ? '●' : '→'}</span>
    </button>
  )
}
