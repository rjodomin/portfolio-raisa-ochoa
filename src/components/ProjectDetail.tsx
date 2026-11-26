import { useEffect, useRef } from 'react'
import type { CollectionEntry, RecordCollection } from '../data/collections'
import styles from './ProjectDetail.module.css'

type Props = { entry: CollectionEntry; collection: RecordCollection; catalogue: boolean; onSelect: (id: string) => void; onClose: () => void }
export function ProjectDetail({ entry, collection, catalogue, onSelect, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="project-detail-title"
    onClose={event => { if (!event.currentTarget.open && event.currentTarget.isConnected) onClose() }}>
    <header className={styles.header}>
      <div><p>{catalogue ? 'Colección completa' : 'Ficha del proyecto'}</p><h2 id="project-detail-title">{catalogue ? collection.title : entry.title}</h2></div>
      <button type="button" className={styles.close} aria-label="Cerrar ficha" onClick={() => dialog.current?.close()}>×</button>
    </header>
    {catalogue ? <ul className={styles.catalogue}>{collection.entries.map(item => <li key={item.id}>
      <button type="button" onClick={() => onSelect(item.id)}><img src={item.image} alt="" /><span>{item.title}</span><small>{item.provisional ? 'Ficha provisional' : 'Ver ficha'} ↗</small></button>
    </li>)}</ul> : <div className={styles.content}>
      <figure><img src={entry.image} alt="" /><figcaption>{entry.imageNote}</figcaption></figure>
      <div>
        {entry.provisional && <p className={styles.pending}>Contenido provisional · pendiente de completar</p>}
        <p className={styles.description}>{entry.description}</p>
        {entry.technologies && <><h3>Tecnologías</h3><ul className={styles.tags}>{entry.technologies.map(technology => <li key={technology}>{technology}</li>)}</ul></>}
        <p className={styles.note}>Las capturas, enlaces, vídeos y aportaciones detalladas se incorporarán cuando estén confirmados.</p>
      </div>
    </div>}
  </dialog>
}
