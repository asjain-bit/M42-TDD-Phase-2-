/**
 * Skeleton — Atom
 * A pulsing placeholder block shown where content is still loading.
 * Used in: ServiceLineInterestScreen
 */

import React from 'react'
import type { SkeletonProps } from './Skeleton.types'

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <span
    aria-hidden="true"
    className={`block bg-bg-surface-2 rounded-md animate-pulse motion-reduce:animate-none ${className}`.trim()}
  />
)
