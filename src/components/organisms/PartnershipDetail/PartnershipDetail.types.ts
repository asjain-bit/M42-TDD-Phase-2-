import type {
  InternalInterestStakeholder,
  PartnershipRequest,
  QuestionAnswer,
  QuestionnaireQuestion,
  StrategyMemberResponse,
} from '@/types/partnership.types'
import type { AdminRouting, AuditInput, CaseAction } from '@/lib/caseActions'
import type { UserProfile } from '@/components/screens/LoginScreen'

export type DetailTab = 'review' | 'audit'

export interface PartnershipDetailProps {
  request: PartnershipRequest
  onBack: () => void
  onProceed: (requestId: string, reason: string) => void
  onReject: (requestId: string, reason: string) => void
  userProfile?: UserProfile
  /** Every case, used by the Partnership Admin checks to spot repeat applicants */
  allRequests?: PartnershipRequest[]
  /** Director asks the vendor for more information; the case goes on hold */
  onRequestInfo?: (requestId: string, email: { to: string; subject: string; body: string }) => void
  /** Vendor information has arrived */
  onResume?: (requestId: string) => void
  /** Partnership Admin routes the case */
  onRoute?: (requestId: string, routing: AdminRouting) => void
  /** Something worth recording in the audit log happened (logged once per key) */
  onLog?: (requestId: string, event: AuditInput) => void
  /** Director sends a review request to a team */
  onSendReview?: (
    requestId: string,
    team: 'internal' | 'strategy',
    payload: {
      members: InternalInterestStakeholder[]
      questionnaire?: { name: string; questions: QuestionnaireQuestion[] }
    }
  ) => void
  /** A reviewing team submits its answers, which counts as that stage's approval */
  onSubmitReview?: (
    requestId: string,
    team: 'internal' | 'strategy',
    payload: { answers?: QuestionAnswer[]; response?: StrategyMemberResponse }
  ) => void
  /** Late-stage changes: Internal Interest outcome, sponsors, NDA, discovery, value and TDD */
  onCaseAction?: (requestId: string, action: CaseAction) => void
  /** Play the agent run animation on first open. Turn off to start at the brief. */
  animateAgentRun?: boolean
  /** Browse every stage without any actions (TDD Admin) */
  viewOnly?: boolean
  /** Text of the back link at the top */
  backLabel?: string
  className?: string
}
