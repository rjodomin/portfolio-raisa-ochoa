import { useEffect, useRef } from 'react'
import type { CollectionEntry } from '../data/collections'
import styles from './ProjectCarousel.module.css'

type Props = { entries: CollectionEntry[]; activeId: string; onSelect: (id: string) => void; onDetail: () => void }

export function ProjectCarousel({ entries, activeId, onSelect, onDetail }: Props) {
  const track = useRef<HTMLUListElement>(null)
  const userScrolling = useRef(false)
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const index = entries.findIndex(entry => entry.id === activeId)
  const multiple = entries.length > 1
  const move = (direction: number) => onSelect(entries[(index + direction + entries.length) % entries.length].id)

  useEffect(() => {
    const element = track.current
    if (!element) return
    const align = () => {
      const item = element.children[index] as HTMLElement
      if (!item) return
      userScrolling.current = false
      element.scrollTo({ left: item.offsetLeft - (element.clientWidth - item.offsetWidth) / 2,
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    }
    align()
    const observer = new ResizeObserver(align)
    observer.observe(element)
    return () => observer.disconnect()
  }, [index])
  useEffect(() => () => { if (settleTimer.current) clearTimeout(settleTimer.current) }, [])

  function scrollSelection() {
    if (!userScrolling.current) return
    if (settleTimer.current) clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => {
      const element = track.current
      if (!element) return
      const center = element.scrollLeft + element.clientWidth / 2
      const items = Array.from(element.children) as HTMLElement[]
      const nearest = items.reduce((best, item, i) =>
        Math.abs(item.offsetLeft + item.offsetWidth / 2 - center) <
        Math.abs(items[best].offsetLeft + items[best].offsetWidth / 2 - center) ? i : best, 0)
      userScrolling.current = false
      onSelect(entries[nearest].id)
    }, 180)
  }

  return <div className={styles.carousel} role="region" aria-label="Colección de carátulas" aria-roledescription="carrusel">
    <div className={styles.toolbar}>
      <span aria-live="polite" aria-atomic="true">{String(index + 1).padStart(2, '0')} / {String(entries.length).padStart(2, '0')}</span>
      {multiple && <div className={styles.arrows}>
        <button type="button" aria-label="Carátula anterior" onClick={() => move(-1)}>←</button>
        <button type="button" aria-label="Carátula siguiente" onClick={() => move(1)}>→</button>
      </div>}
    </div>
    <ul ref={track} className={styles.track} onScroll={scrollSelection}
      onPointerDown={() => { userScrolling.current = true }} onWheel={() => { userScrolling.current = true }}
      onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? entries.length - 1
          : (index + (event.key === 'ArrowLeft' ? -1 : 1) + entries.length) % entries.length
        onSelect(entries[next].id)
        track.current?.children[next].querySelector('button')?.focus({ preventScroll: true })
      }}>
      {entries.map((entry, i) => <li key={entry.id} className={styles.item}>
        <button type="button" className={styles.cover} aria-pressed={entry.id === activeId}
          aria-label={`Seleccionar ${entry.title}`} onClick={() => onSelect(entry.id)} data-project={entry.id}>
          <img src={entry.image} alt="" draggable="false" />
          <span className={styles.coverTitle}>{entry.title}</span>
          <span className={styles.coverNumber}>{String(i + 1).padStart(2, '0')} / RAISA OCHOA</span>
          {entry.provisional && <span className={styles.provisional}>Arte provisional</span>}
        </button>
      </li>)}
    </ul>
    <div className={styles.bottom}>
      <div className={styles.dots} aria-label="Elegir carátula">{multiple && entries.map(entry =>
        <button type="button" key={entry.id} aria-label={`Ir a ${entry.title}`} aria-pressed={entry.id === activeId} onClick={() => onSelect(entry.id)}><span /></button>)}</div>
      <button type="button" className={styles.detail} data-open-detail onClick={onDetail}>Abrir ficha <span aria-hidden="true">↗</span></button>
    </div>
  </div>
}
