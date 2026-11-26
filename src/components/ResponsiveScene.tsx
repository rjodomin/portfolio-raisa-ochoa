import { useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import styles from './ResponsiveScene.module.css'
import { minimumSceneHeight, projectScene } from '../data/sceneLayout'

/** One coordinate plane for photography, hit targets and animated objects.
 * Measure the available slot, never the scaled child (avoids resize loops).
 * Crop the decorative perimeter, keeping the interaction bounds safe.
 */
export function ResponsiveScene({ children }: { children: ReactNode }) {
  const slot = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    const element = slot.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize(previous => previous.width === width && previous.height === height
        ? previous : { width, height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const projection = projectScene(size.width, size.height)
  const style = {
    '--minimum-scene-height': `${minimumSceneHeight(size.width)}px`,
    '--plane-width': `${projection.width}px`,
    '--plane-height': `${projection.height}px`,
    '--plane-left': `${projection.left}px`,
    '--plane-top': `${projection.top}px`,
  } as CSSProperties
  const layout = size.width <= 600 ? 'mobile'
    : size.width <= 900 || size.width / size.height < 1.15 ? 'tablet'
    : size.height <= minimumSceneHeight(size.width) + 1 || size.width / size.height < 1.6
      ? 'compact' : 'panoramic'
  return <div ref={slot} data-layout={layout} className={styles.slot} style={style}>{children}</div>
}
