import { ambientModes } from '../data/ambient'
import type { AmbientMode, AmbientPreference } from '../data/ambient'
import styles from './AmbientControls.module.css'

type Props = {
  preference: AmbientPreference
  mode: AmbientMode
  onPreference: (preference: AmbientPreference) => void
}

export function AmbientControls({ preference, mode, onPreference }: Props) {
  const label = `${preference === 'auto' ? 'Automático · ' : ''}${ambientModes.find(item => item.id === mode)?.label}`
  return (
    <div className={styles.controls}>
      <label className={styles.control} title={label}>
        <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="6" /><path d="M16 2v4m0 20v4M2 16h4m20 0h4M6 6l3 3m14 14 3 3M6 26l3-3M23 9l3-3" /></svg>
        <span className={styles.srOnly}>Ambiente de la habitación</span>
        <select value={preference} aria-describedby="ambient-current" onChange={event => onPreference(event.target.value as AmbientPreference)}>
          <option value="auto">Hora local · automático</option>
          {ambientModes.map(item => <option key={item.id} value={item.id}>{item.symbol} {item.label}</option>)}
        </select>
      </label>
      <span id="ambient-current" className={styles.current} aria-live="polite">{label}</span>
    </div>
  )
}
