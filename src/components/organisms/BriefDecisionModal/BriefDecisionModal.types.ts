export type BriefDecisionChoice = 'approve' | 'reject' | 'request_info'

export interface InfoEmail {
  to: string
  subject: string
  body: string
}

export interface BriefDecisionModalProps {
  /** What the assessment suggests, used to hint the choice */
  agentRecommendation?: 'proceed' | 'reject'
  /** Template shown when more information is requested */
  email: InfoEmail
  /** Approve or reject, with the reason (optional for approve, mandatory for reject) */
  onSubmit: (decision: 'approve' | 'reject', reason: string) => void
  /** The Director has requested more information using this email */
  onRequestInfo: (email: InfoEmail) => void
  onClose: () => void
}
