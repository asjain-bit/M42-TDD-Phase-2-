/**
 * TddAdminValueRoi — Template
 * TDD Admin's Value and ROI Insights page: the same Overview and Value/ROI design as the other
 * profile views (TDD Admin can recalculate), with TDD Admin's own assessments by status.
 * Used in: TddAdminApp
 */

'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { UsageInsightsScreen } from '@/components/screens/UsageInsightsScreen'
import { USAGE_WEEKS, type UsageAssumptions } from '@/lib/usageInsights'

interface AssessmentItem {
  id: string
  name: string
  round: string
}

// TDD Admin's assessments for a week, kept from the M42 Tech Due Diligence admin app
const assessmentsForWeek = (weekIndex: number) => {
  const weekNum = weekIndex + 1

  const completedList: AssessmentItem[] = [
    {
      id: `comp-1-${weekNum}`,
      name: 'Presight AI | Technical Questionnaire',
      round: 'Round 1',
    },
    {
      id: `comp-2-${weekNum}`,
      name: 'Directus Inc. | Data Protection & Privacy',
      round: 'Round 2',
    },
    {
      id: `comp-3-${weekNum}`,
      name: 'Pango Group LLC | Information Security',
      round: 'Initial Review',
    },
    {
      id: `comp-4-${weekNum}`,
      name: 'CloudScale AI Systems | Supply Chain Security',
      round: 'Round 3',
    },
    {
      id: `comp-5-${weekNum}`,
      name: 'CyberGuard Solutions | ISO 27001 Checklist',
      round: 'Annual Audit',
    },
    // Additional items for See More
    {
      id: `comp-6-${weekNum}`,
      name: 'PharmaTech Analytics | Clinical AI Safety',
      round: 'Pre-onboarding',
    },
    {
      id: `comp-7-${weekNum}`,
      name: 'BioHealth Analytics | Ingestion Engine Review',
      round: 'Round 1',
    },
    {
      id: `comp-8-${weekNum}`,
      name: 'Delphi AI Technologies | Architecture Discovery',
      round: 'Round 2',
    },
  ]

  const scheduledList: AssessmentItem[] = [
    {
      id: `sch-1-${weekNum}`,
      name: 'Apex Systems Advisory | Technical Assessment',
      round: 'Stage 2 Audit',
    },
    {
      id: `sch-2-${weekNum}`,
      name: 'PharmaTech Analytics | Model Governance',
      round: 'Follow-up',
    },
    {
      id: `sch-3-${weekNum}`,
      name: 'MedSec Audit Co | DOH Compliance Telemetry',
      round: 'Round 2',
    },
    {
      id: `sch-4-${weekNum}`,
      name: 'Directus Inc. | Cross-Border Data Flow',
      round: 'Round 1',
    },
    {
      id: `sch-5-${weekNum}`,
      name: 'Presight AI | API Authorization Audit',
      round: 'Round 3',
    },
    // Additional items for See More
    {
      id: `sch-6-${weekNum}`,
      name: 'BioHealth Analytics | PHI Encryption Review',
      round: 'Initial Review',
    },
    {
      id: `sch-7-${weekNum}`,
      name: 'CloudScale AI | Microservices Resilience',
      round: 'Stage 1',
    },
  ]

  const finalisedList: AssessmentItem[] = [
    {
      id: `fin-1-${weekNum}`,
      name: 'Delphi AI Technologies | SOC 2 Type II',
      round: 'Technical Final',
    },
    {
      id: `fin-2-${weekNum}`,
      name: 'HealthCloud Telemetry | Cloud Infrastructure',
      round: 'Stage 1 Discovery',
    },
    {
      id: `fin-3-${weekNum}`,
      name: 'Global Diagnostics IT | Business Continuity',
      round: 'Final Review',
    },
    {
      id: `fin-4-${weekNum}`,
      name: 'Pango Group LLC | Penetration Testing Audit',
      round: 'Final Signoff',
    },
    {
      id: `fin-5-${weekNum}`,
      name: 'BioHealth Analytics | HIPAA & Healthcare Data',
      round: 'Executive Audit',
    },
    // Additional items for See More
    {
      id: `fin-6-${weekNum}`,
      name: 'CyberGuard Solutions | BCP & ISO 22301',
      round: 'Closure Review',
    },
    {
      id: `fin-7-${weekNum}`,
      name: 'Presight AI | Comprehensive Vendor Review',
      round: 'Finalised Round',
    },
  ]

  return [
    { title: 'Completed', items: completedList },
    { title: 'Scheduled', items: scheduledList },
    { title: 'Finalised', items: finalisedList },
  ]
}

const TddAdminAssessmentsByStatus: React.FC<{ weekIndex: number }> = ({ weekIndex }) => {
  const [showAll, setShowAll] = useState(false)
  const groups = assessmentsForWeek(weekIndex)
  const hasMore = groups.some((g) => g.items.length > 4)

  return (
    <section aria-labelledby="tdd-admin-usage-status" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 id="tdd-admin-usage-status" className="text-lg font-semibold text-[#0d212c]">
          Assessments by Status
        </h2>
        <span className="text-sm text-[#64748b]">Week of {USAGE_WEEKS[weekIndex].full}</span>
      </div>
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs p-5 sm:p-6 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:divide-x md:divide-[#f1f5f9]">
          {groups.map((group) => (
            <div
              key={group.title}
              className="flex flex-col gap-3 md:first:pl-0 md:pl-6 md:pr-6 md:last:pr-0"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-base font-semibold text-[#0d212c]">{group.title}</h3>
                <span
                  className="text-base font-semibold text-[#0d212c]"
                  aria-label={`${group.items.length} ${group.title.toLowerCase()}`}
                >
                  {group.items.length}
                </span>
              </div>
              <ul aria-label={group.title} className="flex flex-col divide-y divide-[#f1f5f9]">
                {(showAll ? group.items : group.items.slice(0, 4)).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-4 py-3 text-sm"
                  >
                    <span className="text-[#0d212c] truncate" title={item.name}>
                      {item.name}
                    </span>
                    <span className="text-[#36c0c9] font-medium whitespace-nowrap pl-3 shrink-0">
                      {item.round}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {hasMore && (
          <button
            type="button"
            onClick={() => setShowAll((s) => !s)}
            className="self-center inline-flex items-center gap-1 text-sm font-medium text-[#36c0c9] hover:text-[#2fb0b9] cursor-pointer transition"
          >
            {showAll ? 'See less' : 'See more'}
            {showAll ? (
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    </section>
  )
}

export const TddAdminValueRoi: React.FC<{
  /** The Value/ROI inputs shared with the other profile views */
  assumptions?: UsageAssumptions
  onRecalculate?: (assumptions: UsageAssumptions) => void
}> = ({ assumptions, onRecalculate }) => (
  <div className="w-full p-6">
    <UsageInsightsScreen
      canRecalculate
      assumptions={assumptions}
      onRecalculate={onRecalculate}
      renderStatusSection={(weekIndex) => <TddAdminAssessmentsByStatus weekIndex={weekIndex} />}
    />
  </div>
)
