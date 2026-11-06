'use client'

/**
 * DocumentViewer — Organism
 * A document on white A4 pages over a grey background, scrolling only inside the viewer, with
 * the file name, the current page, Download and close (X, Esc or a click outside).
 * Used in: NdaStage, DiscoveryCallStage
 */

import React, { useEffect, useId, useRef, useState } from 'react'
import { Download, X } from 'lucide-react'
import type { DocumentViewerProps } from './DocumentViewer.types'

/** A4 is 210 x 297 mm */
const A4_RATIO = 297 / 210

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  fileName,
  downloadHref,
  downloadName,
  contentLabel,
  children,
  onClose,
}) => {
  const titleId = useId()
  const scrollRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [pages, setPages] = useState({ current: 1, total: 1, height: 0 })

  // Page x of y, from the sheet's height in A4 pages and how far it has been scrolled
  const measure = () => {
    const sheet = sheetRef.current
    const scroller = scrollRef.current
    if (!sheet || !scroller) return
    const pageHeight = sheet.offsetWidth * A4_RATIO
    if (!pageHeight) return
    const content = sheet.firstElementChild as HTMLElement | null
    const contentHeight = (content?.offsetHeight ?? sheet.scrollHeight) + 96
    const total = Math.max(1, Math.ceil(contentHeight / pageHeight))
    const middle = scroller.scrollTop + scroller.clientHeight / 2 - sheet.offsetTop
    const current = Math.min(total, Math.max(1, Math.floor(middle / pageHeight) + 1))
    setPages({ current, total, height: pageHeight })
  }

  const latestClose = useRef(onClose)
  latestClose.current = onClose

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    measure()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && latestClose.current()
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', measure)
      opener?.focus?.()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-bg-overlay" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative w-full max-w-4xl h-full max-h-[92vh] flex flex-col rounded-xl overflow-hidden border border-border-default bg-bg-modal shadow-2xl outline-none"
      >
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-[#d3dbe4] shrink-0">
          <div className="flex flex-col min-w-0">
            <h3 id={titleId} className="text-sm font-semibold text-text-primary truncate">
              {fileName}
            </h3>
            <span className="text-xs text-text-tertiary" aria-live="polite">
              Page {pages.current} of {pages.total}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {downloadHref && (
              <a
                href={downloadHref}
                download={downloadName}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-default text-xs font-medium text-text-primary hover:bg-bg-hover transition"
              >
                <Download className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                Download
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-hover cursor-pointer transition"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
        </div>
        <div
          ref={scrollRef}
          onScroll={measure}
          tabIndex={0}
          aria-label={contentLabel}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-bg-surface-3 px-4 sm:px-10 py-8 outline-none"
        >
          {/* One white sheet, a whole number of A4 pages tall, with dashed page breaks */}
          <div
            ref={sheetRef}
            className="relative mx-auto w-full max-w-[794px] bg-bg-default shadow-md px-8 sm:px-14 py-12"
            style={{ minHeight: pages.height ? pages.total * pages.height : undefined }}
          >
            <div>{children}</div>
            {pages.height > 0 &&
              Array.from({ length: pages.total - 1 }, (_, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  style={{ top: (i + 1) * pages.height }}
                  className="absolute left-0 right-0 border-t border-dashed border-border-strong"
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
