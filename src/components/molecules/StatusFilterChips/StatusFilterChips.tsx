/**
 * StatusFilterChips — Molecule
 * Row of status filter chips with counts, styled like the Dashboard's.
 * Used in: InternalInterestsScreen, ExistingProjectsScreen
 */

import React from 'react'
import type { StatusFilterChipsProps } from './StatusFilterChips.types'

export const StatusFilterChips: React.FC<StatusFilterChipsProps> = ({
  chips,
  selected,
  onSelect,
  className = '',
}) => (
  <div
    role="group"
    aria-label="Filter by status"
    className={`flex flex-wrap items-center gap-2 ${className}`.trim()}
  >
    {chips.map((chip) => {
      const isSelected = selected === chip.key
      return (
        <button
          key={chip.key}
          type="button"
          aria-pressed={isSelected}
          onClick={() => onSelect(chip.key)}
          className={`px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
            isSelected
              ? 'bg-[var(--app-accent)] text-text-inverse font-semibold shadow-xs'
              : 'bg-bg-default text-text-secondary border border-border-default hover:bg-bg-hover'
          }`}
        >
          <span>{chip.label}</span>
          <span
            className={`text-[10px] font-semibold px-1.5 rounded-full ${
              isSelected
                ? 'bg-bg-default/25 text-text-inverse'
                : 'bg-bg-surface-2 text-text-secondary'
            }`}
          >
            {chip.count}
          </span>
        </button>
      )
    })}
  </div>
)
