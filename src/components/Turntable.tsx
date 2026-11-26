import type { PortfolioRecord } from '../data/records'
import type { CSSProperties } from 'react'
import styles from './Turntable.module.css'

type Props = { selected: PortfolioRecord | null; track?: { title: string; color: string }; playing: boolean; onToggle: () => void }

export function Turntable({ selected, track, playing, onToggle }: Props) {
  return (
    <section className={styles.console} aria-label="Tocadiscos">
      <div className={styles.platter} style={{ '--label': track?.color ?? selected?.color ?? '#ec8290' } as CSSProperties} aria-hidden="true">
        <div className={`${styles.disc} ${selected ? styles.loaded : ''} ${playing ? styles.spinning : ''}`}>
          <span className={styles.label}><span>RAISA · {selected?.number ?? '01'}</span><i /></span>
        </div>
        <div className={styles.reflection} />
      </div>
      <button type="button" className={styles.transport} disabled={!selected} onClick={onToggle} aria-label={playing ? 'Pausar giro del vinilo' : 'Reanudar giro del vinilo'}>{playing ? 'Ⅱ' : '▷'}</button>
      <p className={styles.status} role="status" aria-live="polite" aria-atomic="true">
        {selected ? `${playing ? 'Girando' : 'En pausa'} · ${selected.title}${track ? ` · ${track.title}` : ''}` : 'Elige un disco de la colección'}
      </p>
    </section>
  )
}
