import styles from './ContactLinks.module.css'

// Los datos de contacto se pueden actualizar aquí sin cambiar la presentación.
const contactLinks = [
  { title: 'Escríbeme', subtitle: 'raisa.j.ochoa@gmail.com', href: 'mailito:raisa.j.ochoa@gmail.com', icon: 'email' },
  { title: 'GitHub', subtitle: 'Explora mi código y repositorios', href: 'https://github.com/rjodomin', icon: 'github', external: true },
  { title: 'LinkdIn', subtitle: 'Conecta conmigo profesionalmente', href: 'https://www.linkedin.com/in/raisa-julia-ochoa', icon: 'linkedin', external: true },
  { title: 'Mi CV', subtitle: 'Échale un ojo o descarga mi CV', href: '/assets/cv/CV_Raisa_Ochoa_EN.pdf.pdf', icon: 'document', external: true },
] as const

type ContactIcon = (typeof contactLinks)[number]['icon']

function Icon({ name }: { name: ContactIcon }) {
  if (name === 'email') {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>
  }

  if (name === 'github') {
    return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.18-3.37-1.18-.45-1.15-1.11-1.45-1.11-1.45-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.64.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.57 9.57 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.57c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" /></svg>
  }
  if (name === 'linkedin') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V8.997h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.289zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V8.997h3.564v11.455zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />
      </svg>
    )
  }

  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h4M9 12h6M9 16h6" /></svg>
}

export function ContactLinks() {
  return <div className={styles.links} aria-label="Canales de contacto">
    {contactLinks.map(link => <a key={link.title} className={styles.link} href={link.href}
      target={'external' in link && link.external ? '_blank' : undefined}
      rel={'external' in link && link.external ? 'noopener noreferrer' : undefined}>
      <span className={styles.icon}><Icon name={link.icon} /></span>
      <span className={styles.text}><span className={styles.title}>{link.title}</span><span className={styles.subtitle}>{link.subtitle}</span></span>
      <span className={styles.arrow} aria-hidden="true">↗</span>
      {'external' in link && link.external && <span className={styles.srOnly}> (se abre en una pestaña nueva)</span>}
    </a>)}
  </div>
}
