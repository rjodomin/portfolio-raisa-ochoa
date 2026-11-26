import { records } from '../data/records'
import type { PortfolioRecord } from '../data/records'
import { VinylCover } from './VinylCover'
import styles from './RecordShelf.module.css'

type Props = { selected: PortfolioRecord | null; onSelect: (record: PortfolioRecord) => void }

export function RecordShelf({ selected, onSelect }: Props) {
  return (
    <section id="coleccion" className={styles.shelf} aria-label="Colección de secciones del portfolio">
      {records.map(record => <VinylCover key={record.id} record={record} selected={selected?.id === record.id} onSelect={onSelect} />)}
    </section>
  )
}
