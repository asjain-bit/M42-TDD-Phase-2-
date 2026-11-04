'use client'

/**
 * ReviewersLoading — Molecule
 * The simple agent animation, using the full page, shown while the agent finds and maps the
 * Internal Interest or Strategy reviewers, before the stage appears.
 * Used in: PartnershipDetail
 */

import React from 'react'
import { ThinkingMode } from '@/components/organisms/ThinkingMode'
import type { ReviewersLoadingProps } from './ReviewersLoading.types'

export const ReviewersLoading: React.FC<ReviewersLoadingProps> = ({
  team,
  count,
  onComplete,
  className = '',
}) => {
  const isInternal = team === 'internal'
  return (
    <ThinkingMode
      inline
      stepMs={1100}
      onComplete={onComplete}
      className={className}
      eyebrow="MATCHING REVIEWERS"
      description={`The agent is choosing who should review this request. ${count} ${
        count === 1 ? 'reviewer' : 'reviewers'
      } matched so far.`}
      messages={
        isInternal
          ? ['Finding the Internal Interest team', 'Mapping reviewers to KPIs and expertise']
          : ['Finding the Strategy team', 'Mapping the reviewer to this request']
      }
    />
  )
}
