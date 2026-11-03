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
  /** Approve, with an optional reason */
  onSubmit: (decision: 'approve', reason: string) => void
  /** Draft of the email to the partner when rejecting, built from the reason */
  buildRejectEmail: (reason: string) => InfoEmail
  /** Reject: the mandatory reason and the email sent to the partner */
  onReject: (reason: string, email: InfoEmail) => void
  /** The Director has requested more information using this email */
  onRequestInfo: (email: InfoEmail) => void
  onClose: () => void
}
