import { useEffect, useState } from 'react'
import { Introduction } from '../components/Introduction'
import { RecordShelf } from '../components/RecordShelf'
import { Turntable } from '../components/Turntable'
import { Lamp } from '../components/Lamp'
import { AmbientScene } from '../components/AmbientScene'
import { SelectionPanel } from '../components/SelectionPanel'
import { ResponsiveScene } from '../components/ResponsiveScene'
import { records } from '../data/records'
import type { PortfolioRecord } from '../data/records'
import type { AmbientPreference } from '../data/ambient'
import { getAmbientMode } from '../data/ambient'
import { collections } from '../data/collections'
import styles from './HomePage.module.css'

export function HomePage() {
  const [selection, setSelection] = useState<{ record: PortfolioRecord; entryId: string } | null>(null)
  const [closing, setClosing] = useState(false)
  const [lampOn, setLampOn] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [preference, setPreference] = useState<AmbientPreference>('auto')
  const [localMode, setLocalMode] = useState(getAmbientMode)
  useEffect(() => {
    if (preference !== 'auto') return
    function refreshLocalMode() {
      if (document.visibilityState === 'visible') setLocalMode(getAmbientMode())
    }
    const timer = window.setInterval(refreshLocalMode, 60_000)
    document.addEventListener('visibilitychange', refreshLocalMode)
    window.addEventListener('focus', refreshLocalMode)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refreshLocalMode)
      window.removeEventListener('focus', refreshLocalMode)
    }
  }, [preference])
  function changePreference(next: AmbientPreference) {
    if (next === 'auto') setLocalMode(getAmbientMode())
    setPreference(next)
  }
  const mode = preference === 'auto' ? localMode : preference
  const selected = selection?.record ?? null
  const active = selection ? collections[selection.record.id].entries.find(entry => entry.id === selection.entryId) : undefined

  function selectRecord(record: PortfolioRecord) {
    setSelection({ record, entryId: collections[record.id].entries[0].id })
    setClosing(false)
    setPlaying(true)
  }
  function explore() {
    selectRecord(records[1])
  }
  function selectEntry(entryId: string) {
    setSelection(current => current && collections[current.record.id].entries.some(entry => entry.id === entryId)
      ? { ...current, entryId } : current)
  }
  function closePanel() { setClosing(true); setPlaying(false) }
  function finishClose() {
    const id = selected?.id
    setSelection(null)
    setClosing(false)
    document.getElementById(`record-${id}`)?.focus({ preventScroll: true })
  }

  return (
    <div className={styles.page}>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <main id="contenido" className={styles.main} tabIndex={-1}>
        <ResponsiveScene>
        <AmbientScene lampOn={lampOn} mode={mode} preference={preference} onPreference={changePreference}
          objects={<div className={styles.objects}>
            <RecordShelf selected={selected} onSelect={selectRecord} />
            <Turntable selected={selected} track={active} playing={playing} onToggle={() => setPlaying(value => !value)} />
            <Lamp on={lampOn} onToggle={() => setLampOn(value => !value)} />
          </div>}>
          <header className={styles.header}>
            <a className={styles.monogram} href="#contenido" aria-label="Raisa Ochoa, inicio"><svg viewBox="0 0 36 36" aria-hidden="true"><path d="M3 16v4m5-11v18m5-23v28m5-18v8m5-14v20m5-17v14m5-10v6" /></svg></a>
            <nav aria-label="Navegación principal">
              <a href="#contenido" aria-current={!selected ? 'page' : undefined}>Inicio</a>
              {[records[0], records[1], records[4], records[5]].map(record => <button type="button" key={record.id} onClick={() => selectRecord(record)} aria-pressed={selected?.id === record.id}>{record.id === 'web' ? 'Proyectos' : record.id === 'cv' ? 'CV' : record.title}</button>)}
            </nav>
          </header>
          <div className={styles.intro}><Introduction onExplore={explore} /></div>
        </AmbientScene>
        </ResponsiveScene>
        {selected && selection && <SelectionPanel key={selected.id} selected={selected} activeId={selection.entryId}
          playing={playing} closing={closing} mode={mode} lampOn={lampOn}
          onSelect={selectEntry} onToggle={() => setPlaying(value => !value)} onToggleLamp={() => setLampOn(value => !value)}
          onClose={closePanel} onClosed={finishClose} />}
      </main>
      <footer className={styles.footer}><span>Raisa Ochoa — Web & audiovisual</span><span>Un espacio en construcción, hecho con calma.</span></footer>
    </div>
  )
}
