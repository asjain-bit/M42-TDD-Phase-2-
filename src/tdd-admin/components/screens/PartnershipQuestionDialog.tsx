'use client'

import React, { useState } from 'react'
import { validateQuestion, type FormQuestion } from './partnershipForm.data'
import { LIGHT_PRIMARY_BUTTON, Modal, SECONDARY_BUTTON } from './PartnershipFormParts'
import { QuestionFields, tidyQuestion } from './PartnershipQuestionFields'

interface PartnershipQuestionDialogProps {
  /** A blank question for a new one */
  question: FormQuestion
  onSave: (question: FormQuestion) => void
  onClose: () => void
}

/** The Add question dialog */
export const PartnershipQuestionDialog: React.FC<PartnershipQuestionDialogProps> = ({
  question,
  onSave,
  onClose,
}) => {
  const [draft, setDraft] = useState<FormQuestion>(question)
  const [showErrors, setShowErrors] = useState(false)

  const save = () => {
    setShowErrors(true)
    const errors = validateQuestion(draft)
    if (errors.label || errors.options) return
    onSave(tidyQuestion(draft))
  }

  return (
    <Modal
      title="Add question"
      description="Vendors answer this question on the partnership request form."
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <>
          <button type="button" onClick={onClose} className={SECONDARY_BUTTON}>
            Cancel
          </button>
          <button type="button" onClick={save} className={LIGHT_PRIMARY_BUTTON}>
            Add question
          </button>
        </>
      }
    >
      <QuestionFields value={draft} onChange={setDraft} showErrors={showErrors} />
    </Modal>
  )
}
