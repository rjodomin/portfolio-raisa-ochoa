export const records = [
  { id: 'about', title: 'Sobre mí', number: '01', color: '#e9a499', ink: '#56382e', motif: 'sun' },
  { id: 'web', title: 'Proyectos DAW', number: '02', color: '#dfa2ad', ink: '#3b2531', motif: 'grid' },
  { id: 'film', title: 'Audiovisual', number: '03', color: '#7d365b', ink: '#fff7ec', motif: 'frame' },
  { id: 'music', title: 'Música', number: '04', color: '#b8d4df', ink: '#273847', motif: 'wave' },
  { id: 'cv', title: 'CV / Experiencia', number: '05', color: '#dfa18f', ink: '#472d26', motif: 'steps' },
  { id: 'contact', title: 'Contacto', number: '06', color: '#e7b4a3', ink: '#492f2d', motif: 'flower' },
] as const

export type PortfolioRecord = (typeof records)[number]
