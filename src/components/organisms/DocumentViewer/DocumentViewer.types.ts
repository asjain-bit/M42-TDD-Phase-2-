import type React from 'react'

export interface DocumentViewerProps {
  /** The file name, shown in the header */
  fileName: string
  /** What Download saves, and under which name */
  downloadHref: string
  downloadName: string
  /** Accessible name of the scrolling page area */
  contentLabel: string
  /** The document itself, laid out on the white A4 sheet */
  children: React.ReactNode
  onClose: () => void
}
