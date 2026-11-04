/**
 * TddAdminApp — Template
 * TDD Admin profile view: the M42 Tech Due Diligence admin app (Dashboard, Questionnaires, Vendors, Agents, Value and ROI), entered from the shared login.
 * Used in: HomePage
 */

'use client'

import React, { useState } from 'react'
import { BarChart3, Bot, Building2, FileText, LayoutDashboard } from 'lucide-react'
import { DashboardScreen } from '@/tdd-admin/components/screens/DashboardScreen'
import { QuestionnairesScreen } from '@/tdd-admin/components/screens/QuestionnairesScreen'
import { VendorsScreen } from '@/tdd-admin/components/screens/VendorsScreen'
import { AgentsScreen } from '@/tdd-admin/components/screens/AgentsScreen'
import { TddAdminValueRoi } from '@/tdd-admin/TddAdminValueRoi'
import { Sidebar } from '@/components/organisms/Sidebar'
import { PartnershipDetail } from '@/components/organisms/PartnershipDetail'
import { PageSkeletonLoader } from '@/tdd-admin/components/molecules/PageSkeletonLoader'
import type { UserProfile } from '@/components/screens/LoginScreen'
import type { PartnershipRequest } from '@/types/partnership.types'
import { completeTddAssessments, getStageLabel, isAwaitingTddAdmin } from '@/lib/caseActions'
import type { UsageAssumptions } from '@/lib/usageInsights'
import './tdd-admin.css'
import './tdd-admin-overrides.css'

type TddAdminTab = 'dashboard' | 'questionnaires' | 'vendors' | 'agents' | 'usage-insights'

const PAGE_TITLES: Record<TddAdminTab, string> = {
  dashboard: 'Dashboard',
  questionnaires: 'Questionnaires',
  vendors: 'Vendors',
  agents: 'Agents',
  'usage-insights': 'Value and ROI Insights',
}

// Same left nav as the other profile views, with Value and ROI last
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  // Soft hyphen so the word wraps in the collapsed nav
  { id: 'questionnaires', label: 'Question\u00ADnaires', icon: FileText },
  { id: 'vendors', label: 'Vendors', icon: Building2 },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'usage-insights', label: 'Value and ROI', icon: BarChart3 },
]

interface TddAdminAppProps {
  userName: string
  userEmail: string
  userAvatarUrl?: string
  /** The partnership requests the other profile views work on; TDD Admin can only view them */
  requests?: PartnershipRequest[]
  /** Updates the shared cases, e.g. when the TDD Admin completes a case's assessments */
  onRequestsChange?: (update: (prev: PartnershipRequest[]) => PartnershipRequest[]) => void
  /** The Value/ROI inputs shared with the other profile views; TDD Admin can recalculate them */
  usageAssumptions?: UsageAssumptions
  onRecalculate?: (assumptions: UsageAssumptions) => void
  onSignOut: () => void
}

export const TddAdminApp: React.FC<TddAdminAppProps> = ({
  userName,
  userEmail,
  userAvatarUrl,
  requests = [],
  onRequestsChange,
  usageAssumptions,
  onRecalculate,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<TddAdminTab>('dashboard')
  const [isPageLoading, setIsPageLoading] = useState(false)
  // Collapsed by default, like the other profile views
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  // Partnership request opened from an assessment row, shown view only
  const [viewing, setViewing] = useState<{
    caseId: string
    vendor: string
    vendorId: string
  } | null>(null)
  const setViewingCaseId = (caseId: null) => setViewing(caseId)
  // The case with the same ID; an assessment with no case yet shows a prototype stand-in built
  // from the furthest-along seed case, under the assessment's own vendor and IDs
  const template = requests.find((r) => r.requestCode === 'PR-122') ?? requests[0]
  const viewingRequest: PartnershipRequest | undefined = !viewing
    ? undefined
    : (requests.find((r) => r.requestCode === viewing.caseId) ??
      (template && {
        ...template,
        id: `tdd-admin-${viewing.caseId}`,
        requestCode: viewing.caseId,
        companyName: viewing.vendor,
        vendorId: viewing.vendorId,
      }))

  const completeAssessments = (caseId: string) =>
    onRequestsChange?.((prev) =>
      prev.map((r) =>
        r.requestCode === caseId ? completeTddAssessments(r, `${userName} (TDD Admin)`) : r
      )
    )

  // The detail page shows every stage as the Partnership Admin sees it, without the actions
  const viewerProfile: UserProfile = {
    id: 'partnership-admin',
    name: userName,
    designation: 'TDD Admin',
    email: userEmail,
    roleTitle: 'TDD Admin',
    avatarUrl: userAvatarUrl,
  }

  const handleTabChange = (tab: TddAdminTab) => {
    setViewingCaseId(null)
    if (tab === activeTab && !isPageLoading) return
    setIsPageLoading(true)
    setActiveTab(tab)
    setTimeout(() => {
      setIsPageLoading(false)
    }, 1000)
  }

  return (
    <div className="tdd-admin min-h-screen bg-[#f8fafc] text-[#0d212c] flex font-sans antialiased">
      <Sidebar
        items={NAV_ITEMS}
        activeTab={activeTab}
        onTabChange={(tab) => handleTabChange(tab as TddAdminTab)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        userName={userName}
        userDesignation="TDD Admin"
        userAvatarUrl={userAvatarUrl}
        onSignOut={onSignOut}
      />

      {/* Right Main Body Layout Container */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'pl-[84px]' : 'pl-[250px]'
        }`}
      >
        {/* Top Header Bar — same size as the other profile views */}
        <header className="w-full bg-white border-b border-[#e2e8f0] px-6 lg:px-10 py-3.5 flex items-center justify-between sticky top-0 z-40 text-[#0d212c] shadow-xs">
          <h1 className="font-semibold text-lg lg:text-xl tracking-tight text-[#0d212c]">
            {PAGE_TITLES[activeTab]}
          </h1>
        </header>

        {/* Main Full-Width Content Area */}
        <main className="flex-1 w-full">
          {isPageLoading ? (
            <PageSkeletonLoader />
          ) : viewingRequest ? (
            <div className="p-6">
              <PartnershipDetail
                request={viewingRequest}
                allRequests={requests}
                userProfile={viewerProfile}
                viewOnly
                backLabel="Back to Assessments"
                onBack={() => setViewingCaseId(null)}
                onProceed={() => {}}
                onReject={() => {}}
              />
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardScreen
                  partnershipCases={requests.map((r) => ({
                    requestCode: r.requestCode,
                    companyName: r.companyName,
                    vendorId: r.vendorId,
                    awaitingTddAdmin: isAwaitingTddAdmin(r),
                    atValueStage: getStageLabel(r) === 'Value & Due Diligence',
                  }))}
                  onViewPartnershipRequest={setViewing}
                  onCompleteAssessments={completeAssessments}
                />
              )}
              {activeTab === 'questionnaires' && <QuestionnairesScreen />}
              {activeTab === 'vendors' && <VendorsScreen />}
              {activeTab === 'agents' && <AgentsScreen />}
              {activeTab === 'usage-insights' && (
                <TddAdminValueRoi assumptions={usageAssumptions} onRecalculate={onRecalculate} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
