import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PortfolioRecord } from '../data/records'
import type { AmbientMode } from '../data/ambient'
import { collections } from '../data/collections'
import { ProjectCarousel } from './ProjectCarousel'
import { MiniVinylPlayer } from './MiniVinylPlayer'
import { ProjectDetail } from './ProjectDetail'
import { ContactLinks } from './ContactLinks'
import styles from './SelectionPanel.module.css'

type Props = {
  selected: PortfolioRecord; activeId: string; playing: boolean; closing: boolean
  mode: AmbientMode; lampOn: boolean
  onSelect: (id: string) => void; onToggle: () => void; onToggleLamp: () => void
  onClose: () => void; onClosed: () => void
}

export function SelectionPanel({ selected, activeId, playing, closing, mode, lampOn, onSelect, onToggle, onToggleLamp, onClose, onClosed }: Props) {
  const panel = useRef<HTMLElement>(null)
  const [detail, setDetail] = useState<'all' | 'entry' | null>(null)
  const collection = collections[selected.id]
  const isContact = selected.id === 'contact'
  const index = collection.entries.findIndex(entry => entry.id === activeId)
  const active = collection.entries[index]
  const move = (direction: number) => onSelect(collection.entries[(index + direction + collection.entries.length) % collection.entries.length].id)

  useEffect(() => { panel.current?.focus({ preventScroll: true }) }, [])
  useEffect(() => {
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !detail && !closing) { event.preventDefault(); onClose() }
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [detail, closing, onClose])

  return createPortal(<section ref={panel} className={styles.panel} aria-labelledby="section-title"
    aria-label={`Explorador de ${selected.title}`} data-explorer data-ambient={mode} data-closing={closing}
    tabIndex={-1} onAnimationEnd={event => { if (closing && event.target === event.currentTarget) onClosed() }}>
    <div className={styles.actions}>
      <button type="button" aria-label={lampOn ? 'Apagar lámpara desde el panel' : 'Encender lámpara desde el panel'} aria-pressed={lampOn} onClick={onToggleLamp}>☼</button>
      <button type="button" onClick={onClose} aria-label="Cerrar sección y retirar el vinilo">×</button>
    </div>
    <div className={styles.layout} data-contact={isContact}>
      <div className={styles.introduction}>
        <p className={styles.eyebrow}>{collection.eyebrow}</p>
        <h2 id="section-title">{collection.title}</h2>
        <p className={styles.description}>{collection.description}</p>
        {!isContact && <><div className={styles.selected} aria-live="polite" aria-atomic="true">
          <h3>{active.title}</h3><p>{active.summary}</p>
        </div>
        <button type="button" className={styles.action} data-open-catalogue onClick={() => setDetail(collection.entries.length > 1 ? 'all' : 'entry')}>{collection.entries.length > 1 ? 'Ver todos' : 'Ver ficha'} <span aria-hidden="true">→</span></button></>}
      </div>
      {isContact ? <ContactLinks /> : <ProjectCarousel entries={collection.entries} activeId={activeId} onSelect={onSelect} onDetail={() => setDetail('entry')} />}
      <MiniVinylPlayer playing={playing} color={active.color} title={active.title}
        multiple={collection.entries.length > 1} onToggle={onToggle} onPrevious={() => move(-1)} onNext={() => move(1)} />
    </div>
    {detail && <ProjectDetail entry={active} collection={collection} catalogue={detail === 'all'}
      onSelect={id => { onSelect(id); setDetail('entry') }} onClose={() => setDetail(null)} />}
  </section>, document.body)
}
