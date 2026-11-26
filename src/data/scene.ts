import type { PortfolioRecord } from './records'

// Coordenadas porcentuales medidas sobre la referencia de 1536 × 1024.
// Las comparte el recorte de recursos y la colocación de los controles HTML.
export const sleevePlacement: Record<PortfolioRecord['id'], {
  x: number; y: number; width: number; height: number; clip: string
}> = {
  about: { x: 48.9, y: 17.6, width: 11.1, height: 16.9, clip: 'polygon(7% 6%, 100% 0, 96% 99%, 0 100%)' },
  web: { x: 65.1, y: 16.6, width: 10.9, height: 17.6, clip: 'polygon(6% 5%, 100% 0, 96% 98%, 0 100%)' },
  film: { x: 81.3, y: 15.8, width: 11.1, height: 18, clip: 'polygon(5% 4%, 100% 0, 99% 98%, 0 100%)' },
  music: { x: 48.9, y: 38.1, width: 10.7, height: 16.4, clip: 'polygon(8% 1%, 100% 0, 96% 100%, 0 100%)' },
  cv: { x: 64.8, y: 37.9, width: 11.2, height: 16.9, clip: 'polygon(5% 1%, 100% 0, 96% 100%, 0 99%)' },
  contact: { x: 81.8, y: 37.9, width: 10.9, height: 17.5, clip: 'polygon(5% 1%, 100% 0, 99% 100%, 0 99%)' },
}
