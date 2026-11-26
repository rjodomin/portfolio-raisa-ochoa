import type { CSSProperties } from 'react'
import styles from './MiniVinylPlayer.module.css'

type Props = { playing: boolean; color: string; title: string; multiple: boolean; onToggle: () => void; onPrevious: () => void; onNext: () => void }
export function MiniVinylPlayer({ playing, color, title, multiple, onToggle, onPrevious, onNext }: Props) {
  return <div className={styles.player} aria-label="Mini tocadiscos">
    <div className={styles.deck} aria-hidden="true">
      <div className={styles.disc} data-mini-disc style={{ '--record-color': color, animationPlayState: playing ? 'running' : 'paused' } as CSSProperties}>
        <span className={styles.label}><span>RO<br />33⅓</span><i /></span>
      </div>
      <span className={`${styles.arm} ${playing ? styles.engaged : ''}`} />
    </div>
    <p className={styles.title}>{title}</p>
    <div className={styles.controls}>
      {multiple && <button type="button" aria-label="Proyecto anterior" onClick={onPrevious}>↤</button>}
      <button type="button" className={styles.toggle} aria-label={playing ? 'Pausar ambos tocadiscos' : 'Reanudar ambos tocadiscos'} aria-pressed={playing} onClick={onToggle}>{playing ? 'Ⅱ' : '▷'}</button>
      {multiple && <button type="button" aria-label="Proyecto siguiente" onClick={onNext}>↦</button>}
    </div>
    <span className={styles.note}>Animación visual · sin audio</span>
  </div>
}
