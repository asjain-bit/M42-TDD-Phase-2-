'use client'

/**
 * RowActionsMenu — Molecule
 * A table row's ⋯ button with a small menu: Edit, and Delete in red. The menu is fixed to the
 * viewport so a scrolling table never clips it; Esc, a click outside or scrolling closes it.
 * Used in: ExistingProjectsScreen, InternalInterestsScreen
 */

import React, { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { RowActionsMenuProps } from './RowActionsMenu.types'

const MENU_WIDTH = 144

export const RowActionsMenu: React.FC<RowActionsMenuProps> = ({ label, onEdit, onDelete }) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [at, setAt] = useState<{ top: number; left: number } | null>(null)
  const close = () => setAt(null)

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (at) return close()
    const box = buttonRef.current?.getBoundingClientRect()
    if (!box) return
    setAt({ top: box.bottom + 4, left: Math.max(8, box.right - MENU_WIDTH) })
  }

  useEffect(() => {
    if (!at) return
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return
      close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      close()
      buttonRef.current?.focus()
    }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [at])

  const pick = (action: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation()
    close()
    action()
  }

  const ITEM =
    'w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md cursor-pointer transition focus:outline-none'

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label={`Actions for ${label}`}
        aria-haspopup="menu"
        aria-expanded={Boolean(at)}
        className={`w-8 h-8 rounded-lg inline-flex items-center justify-center cursor-pointer transition ${
          at
            ? 'bg-bg-hover text-text-primary'
            : 'text-text-tertiary hover:text-text-primary hover:bg-bg-hover'
        }`}
      >
        <MoreHorizontal className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
      </button>
      {at && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={`Actions for ${label}`}
          style={{ top: at.top, left: at.left, width: MENU_WIDTH }}
          className="fixed z-50 rounded-lg border border-border-default bg-bg-modal shadow-lg p-1 animate-in fade-in duration-100"
        >
          <button
            type="button"
            role="menuitem"
            onClick={pick(onEdit)}
            className={`${ITEM} text-text-primary hover:bg-bg-hover focus:bg-bg-hover`}
          >
            <Pencil className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={pick(onDelete)}
            className={`${ITEM} text-status-error-text hover:bg-status-error-bg focus:bg-status-error-bg`}
          >
            <Trash2 className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
            Delete
          </button>
        </div>
      )}
    </>
  )
}
