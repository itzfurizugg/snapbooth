import { Camera } from 'lucide-react'
import { ButtonLink } from './Button'

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="/">
          <span className="brand-mark">
            <Camera aria-hidden="true" size={22} strokeWidth={2} />
          </span>
          <span className="brand-text">
            <strong>SNAPBOOTH</strong>
            <small>PHOTOBOOTH / WEB CLIENT</small>
          </span>
        </a>

        <div className="header-status" aria-label="Status booth">
          <span className="status-dot" aria-hidden="true" />
          <span>BOOTH SIAP</span>
          <span className="status-sep">·</span>
          <span>{import.meta.env.DEV ? 'STORAGE LOKAL' : 'CLOUDINARY'}</span>
        </div>

        <nav className="header-actions" aria-label="Navigasi utama">
          <a className="header-link" href="/#cara-kerja">
            CARA KERJA
          </a>
          <ButtonLink href="/" size="sm" variant="primary">
            MULAI
          </ButtonLink>
        </nav>
      </div>
    </header>
  )
}
