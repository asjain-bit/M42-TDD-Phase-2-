'use client'

/**
 * PartnerEmailFields — Molecule
 * The email to the partner: To (read-only), an editable Subject and Message, each with a copy button.
 * Used in: PartnershipDetail (Close request), BriefDecisionModal (Reject)
 */

import React from 'react'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { CopyButton } from '@/components/molecules/CopyButton'
import type { PartnerEmailFieldsProps } from './PartnerEmailFields.types'

export const PartnerEmailFields: React.FC<PartnerEmailFieldsProps> = ({
  email,
  onChange,
  idPrefix,
  label = 'Email to the partner',
}) => (
  <div className="flex flex-col gap-4" role="group" aria-label={label}>
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-text-secondary">To</span>
        <CopyButton text={email.to} label="recipient" />
      </div>
      <div className="px-3 py-2 rounded-md border border-border-default bg-bg-surface-1 text-sm text-text-primary">
        {email.to}
      </div>
    </div>
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={`${idPrefix}-subject`}
          className="text-xs font-semibold text-text-secondary"
        >
          Subject
        </label>
        <CopyButton text={email.subject} label="subject" />
      </div>
      <Input
        id={`${idPrefix}-subject`}
        value={email.subject}
        onChange={(e) => onChange({ ...email, subject: e.target.value })}
      />
    </div>
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={`${idPrefix}-body`} className="text-xs font-semibold text-text-secondary">
          Message
        </label>
        <CopyButton text={email.body} label="message" />
      </div>
      <Textarea
        id={`${idPrefix}-body`}
        rows={10}
        resize="none"
        value={email.body}
        onChange={(e) => onChange({ ...email, body: e.target.value })}
      />
    </div>
  </div>
)
