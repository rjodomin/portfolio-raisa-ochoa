import clouds from '../assets/cover-clouds.webp'
import architecture from '../assets/cover-architecture.webp'
import palms from '../assets/cover-palms.webp'
import room from '../assets/reference-room.webp'
import type { PortfolioRecord } from './records'

export type CollectionEntry = {
  id: string
  title: string
  summary: string
  description: string
  image: string
  imageNote: string
  color: string
  provisional: boolean
  technologies?: string[]
}
export type RecordCollection = {
  eyebrow: string
  title: string
  description: string
  entries: CollectionEntry[]
}
const pending = (id: string, title: string, summary: string, image = palms): CollectionEntry => ({
  id, title, summary, image, color: '#eaa8b4', provisional: true,
  imageNote: 'Arte provisional · no es una captura',
  description: `${summary} La información y los recursos de esta ficha están pendientes de incorporar.`,
})

// Only the three project names supplied by Raisa and facts from this checkout.
// Art placeholders are deliberately labelled; no other projects are inspected.
export const collections: Record<PortfolioRecord['id'], RecordCollection> = {
  web: {
    eyebrow: 'Proyectos destacados', title: 'Explora mis proyectos',
    description: 'Una colección de proyectos web para descubrir, carátula a carátula.',
    entries: [
      pending('aula-circular', 'Aula Circular', 'Ficha en preparación. Descripción, tecnologías y enlaces pendientes de confirmar.', clouds),
      pending('framework', 'FRAMEWORK — Production Management', 'Ficha en preparación. Descripción, tecnologías y enlaces pendientes de confirmar.', architecture),
      { id: 'portfolio', title: 'Portfolio interactivo de vinilos', color: '#b3caa0',
        summary: 'Una habitación interactiva para explorar este portfolio mediante vinilos.',
        description: 'Portfolio personal de Raisa Ochoa desarrollado con React, TypeScript y Vite. Integra carátulas interactivas, un tocadiscos animado, iluminación ambiental y una lámpara que se puede encender y apagar. La escena utiliza fotografías y controles HTML sobre un plano de coordenadas compartido.',
        image: room, imageNote: 'Imagen de la habitación de este portfolio', provisional: false,
        technologies: ['React', 'TypeScript', 'Vite', 'CSS Modules', 'ResizeObserver'],
      },
    ],
  },
  about: {
    eyebrow: 'Sobre mí', title: 'Un espacio de encuentro',
    description: 'Desarrollo web, comunicación audiovisual, diseño y música.',
    entries: [{ id: 'raisa', title: 'Raisa Ochoa', color: '#e9a499', image: clouds,
      imageNote: 'Arte provisional · no es un retrato', provisional: true,
      summary: 'Desarrolladora web y comunicación audiovisual.',
      description: 'Raisa Ochoa. Desarrollo web, comunicación audiovisual, diseño y música son los puntos de encuentro de este portfolio. La biografía ampliada está pendiente de incorporar.',
    }],
  },
  film: { eyebrow: 'Audiovisual', title: 'Historias por compartir',
    description: 'Un espacio reservado para los proyectos audiovisuales.',
    entries: [pending('film-pending', 'Colección audiovisual', 'Contenido provisional. Los proyectos audiovisuales se incorporarán cuando estén confirmados.', architecture)] },
  music: { eyebrow: 'Música', title: 'El lado musical',
    description: 'La música forma parte de la identidad de este espacio.',
    entries: [pending('music-pending', 'Colección musical', 'Contenido provisional. La selección musical está en preparación.')] },
  cv: { eyebrow: 'CV / Experiencia', title: 'Mi recorrido',
    description: 'Formación y experiencia, reunidas en una colección.',
    entries: [pending('cv-pending', 'CV / Experiencia', 'Contenido provisional. La formación y la experiencia se añadirán cuando estén confirmadas.', clouds)] },
  contact: { eyebrow: 'Contacto', title: 'Seguimos en contacto',
    description: '¿Tienes un proyecto en mente, una oportunidad profesional o simplemente quieres conectar? Estoy abierta a nuevas experiencias, colaboraciones y oportunidades para seguir aprendiendo y creciendo como desarrolladora.',
    entries: [{ id: 'contact-pending', title: 'Contacto', summary: '', description: '', image: palms,
      imageNote: '', color: '#eaa8b4', provisional: false }] },
}
