import type { ReactNode } from 'react'
import type { AmbientMode, AmbientPreference } from '../data/ambient'
import { AmbientControls } from './AmbientControls'
import interior from '../assets/reference-room.webp'
import styles from './AmbientScene.module.css'

const photographs = import.meta.glob('../assets/reference-*.webp', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>

type Props = {
  lampOn: boolean
  mode: AmbientMode
  preference: AmbientPreference
  onPreference: (preference: AmbientPreference) => void
  children: ReactNode
  objects: ReactNode
}

export function AmbientScene({ lampOn, mode, preference, onPreference, children, objects }: Props) {
  return (
    <div className={styles.scene} data-ambient={mode} data-lamp={lampOn ? 'on' : 'off'}>
      {children}
      <div className={styles.physicalPlane} data-scene-plane>
      <img className={styles.interior} src={interior} width="1536" height="1024" alt="" fetchPriority="high" />
      {['day', 'cloudy', 'night'].map(variant => (
        <img
          key={variant} data-photo={variant}
          className={`${styles.interior} ${styles.variant}`}
          src={photographs[`../assets/reference-${variant}.webp`]}
          width="1536" height="1024" alt="" decoding="async"
        />
      ))}
      <img
        className={`${styles.interior} ${styles.unlitLamp}`}
        src={photographs['../assets/reference-lamp-off.webp']}
        width="1536" height="1024" alt="" decoding="async"
      />
      <div className={styles.windowLight} aria-hidden="true" />
      <div className={styles.lampLight} aria-hidden="true" />
      <span className={styles.framedNote} aria-hidden="true">GOOD<br />MUSIC<br />GOOD<br />IDEAS ♡</span>
      {objects}
      </div>
      <AmbientControls preference={preference} mode={mode} onPreference={onPreference} />
    </div>
  )
}
