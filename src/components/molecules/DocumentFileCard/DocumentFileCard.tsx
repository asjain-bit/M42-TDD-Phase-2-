/**
 * DocumentFileCard — Molecule
 * A document as a file: a small page thumbnail, its name, one line about it, and Preview.
 * Used in: NdaStage, DiscoveryCallStage
 */

import React from 'react'
import { Eye } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import type { DocumentFileCardProps } from './DocumentFileCard.types'

/** A tiny page with text lines, standing in for the document's first page */
const PageThumbnail: React.FC = () => (
  <span
    aria-hidden="true"
    className="w-10 h-[52px] shrink-0 rounded-[3px] border border-border-default bg-bg-default shadow-xs px-1.5 py-2 flex flex-col gap-1"
  >
    <span className="h-1 w-3/4 rounded-full bg-border-strong" />
    {[0, 1, 2, 3, 4].map((i) => (
      <span key={i} className="h-0.5 w-full rounded-full bg-border-default" />
    ))}
    <span className="h-0.5 w-2/3 rounded-full bg-border-default" />
  </span>
)

export const DocumentFileCard: React.FC<DocumentFileCardProps> = ({
  fileName,
  meta,
  onPreview,
  className = '',
}) => (
  <div
    className={`flex items-center gap-4 rounded-xl border border-border-default bg-bg-default px-4 py-3 ${className}`.trim()}
  >
    <PageThumbnail />
    <div className="flex flex-col min-w-0 flex-1">
      <span className="text-sm font-medium text-text-primary truncate">{fileName}</span>
      <span className="text-xs text-text-tertiary">{meta}</span>
    </div>
    <Button variant="outline" size="sm" onClick={onPreview} className="gap-1.5 shrink-0">
      <Eye className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
      Preview
    </Button>
  </div>
)
