import { profile } from '../data/profile'
import styles from './Introduction.module.css'

export function Introduction({ onExplore }: { onExplore: () => void }) {
  const [profession, discipline] = profile.subtitle.split(' y ')
  return (
    <section className={styles.introduction} aria-labelledby="intro-title">
      <p className={styles.eyebrow}>Hola, soy</p>
      <h1 id="intro-title" className={styles.title}>{profile.name}</h1>
      <p className={styles.subtitle}><span>{profession}</span><span>y {discipline}</span></p>
      <span className={styles.accent} aria-hidden="true" />
      <p className={styles.description}>Tecnología, creatividad y música<br />como punto de encuentro.<br />Desarrollo <strong>aplicaciones web</strong><br />y creo <strong>contenido audiovisual.</strong></p>
      <button type="button" className={styles.explore} onClick={onExplore}>Explorar proyectos <span aria-hidden="true">⟶</span></button>
    </section>
  )
}
