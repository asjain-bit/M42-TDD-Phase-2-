export type BriefDecisionChoice = 'approve' | 'request_info'

export interface InfoEmail {
  to: string
  subject: string
  body: string
}

export interface BriefDecisionModalProps {
  /** What the assessment suggests: Proceed is hinted; a reject leaning points to Close request */
  agentRecommendation?: 'proceed' | 'reject'
  /** Template shown when more information is requested */
  email: InfoEmail
  /** Approve, with an optional reason */
  onSubmit: (decision: 'approve', reason: string) => void
  /** The Director has requested more information using this email */
  onRequestInfo: (email: InfoEmail) => void
  onClose: () => void
}
