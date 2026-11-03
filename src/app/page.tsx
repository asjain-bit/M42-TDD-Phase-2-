'use client'

import React, { useState } from 'react'
import { LoginScreen, AVAILABLE_PROFILES, type UserProfile } from '@/components/screens/LoginScreen'
import { UsageInsightsScreen } from '@/components/screens/UsageInsightsScreen'
import { DashboardScreen } from '@/components/screens/DashboardScreen'
import { VendorWebForm } from '@/components/screens/VendorWebForm'
import {
  ServiceLineInterestScreen,
  type ServiceLineDraft,
} from '@/components/screens/ServiceLineInterestScreen'
import { ServiceLineAllInterestsScreen } from '@/components/screens/ServiceLineAllInterestsScreen'
import { InternalInterestsScreen } from '@/components/screens/InternalInterestsScreen'
import { ExistingProjectsScreen } from '@/components/screens/ExistingProjectsScreen'
import { Sidebar } from '@/components/organisms/Sidebar'
import {
  BarChart3,
  FolderKanban,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  CirclePlus,
} from 'lucide-react'
import { TddAdminApp } from '@/tdd-admin/TddAdminApp'
import {
  INITIAL_PARTNERSHIP_REQUESTS,
  INITIAL_SERVICE_LINE_INTERESTS,
  EXISTING_PROJECTS,
  type Overlap,
  type PartnershipRequest,
  type ServiceLineInterest,
} from '@/types/partnership.types'
import { buildCaseFromForm, nextCaseCode } from '@/lib/caseActions'
import { nextInterestCode } from '@/lib/serviceLineMatch'
import { findOverlaps } from '@/lib/overlaps'
import type { StatusRole } from '@/lib/caseStatus'
import { DEFAULT_ASSUMPTIONS, type UsageAssumptions } from '@/lib/usageInsights'
import type { CustomKpi } from '@/lib/customKpi'
import type { VendorFormValues } from '@/types/vendorForm'

type MainTab =
  | 'dashboard'
  | 'usage'
  | 'internal-interests'
  | 'existing-projects'
  | 'new-interest'
  | 'all-interests'

const TAB_TITLES: Record<MainTab, string> = {
  dashboard: 'Dashboard',
  usage: 'Value and ROI Insights',
  'internal-interests': 'Internal Interests',
  'existing-projects': 'Existing Projects',
  'new-interest': 'New interest',
  'all-interests': 'All interests',
}

export default function HomePage() {
  // Land on SSO login screen first
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState<MainTab>('dashboard')
  // Default designation is Director as requested
  const [userProfile, setUserProfile] = useState<UserProfile>(
    AVAILABLE_PROFILES.find((p) => p.id === 'director') ?? AVAILABLE_PROFILES[0]
  )
  // Cases are shared by every profile for the length of the session
  const [requests, setRequests] = useState<PartnershipRequest[]>(INITIAL_PARTNERSHIP_REQUESTS)
  // Service line requirements, shared like the cases
  const [serviceLineInterests, setServiceLineInterests] = useState<ServiceLineInterest[]>(
    INITIAL_SERVICE_LINE_INTERESTS
  )
  // Results of the last overlap check on the existing projects, by project id
  const [projectOverlaps, setProjectOverlaps] = useState<Record<string, Overlap[]>>({})
  // The Value/ROI inputs the Partnership Admin last recalculated, shown to every profile
  const [usageAssumptions, setUsageAssumptions] = useState<UsageAssumptions>(DEFAULT_ASSUMPTIONS)
  // KPIs the Partnership Admin built, shown to every profile for the session
  const [customKpis, setCustomKpis] = useState<CustomKpi[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)

  const handleLogin = (profile: UserProfile) => {
    setUserProfile(profile)
    setActiveTab(profile.id === 'service-line' ? 'new-interest' : 'dashboard')
    setIsAuthenticated(true)
  }

  const todayLabel = () =>
    new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  // A new interest waits for the Strategy Team, and is checked for overlaps straight away
  const handleInterestSubmit = (draft: ServiceLineDraft) => {
    const code = nextInterestCode(serviceLineInterests)
    const interest: ServiceLineInterest = {
      ...draft,
      code,
      submittedBy: userProfile.name,
      on: todayLabel(),
      status: 'Pending review',
    }
    interest.overlaps = findOverlaps(interest, serviceLineInterests, EXISTING_PROJECTS, requests)
    setServiceLineInterests((prev) => [interest, ...prev])
    return code
  }

  const decideInterest = (code: string, decision: 'Approved' | 'Declined', reason?: string) =>
    setServiceLineInterests((prev) =>
      prev.map((i) =>
        i.code === code
          ? {
              ...i,
              status: decision,
              decidedBy: userProfile.name,
              decidedOn: todayLabel(),
              declineReason: decision === 'Declined' ? reason : undefined,
            }
          : i
      )
    )

  const runInterestOverlaps = () =>
    setServiceLineInterests((prev) =>
      prev.map((i) => ({ ...i, overlaps: findOverlaps(i, prev, EXISTING_PROJECTS, requests) }))
    )

  const runProjectOverlaps = () =>
    setProjectOverlaps(
      Object.fromEntries(
        EXISTING_PROJECTS.map((p) => [
          p.id,
          findOverlaps(p, serviceLineInterests, EXISTING_PROJECTS, requests),
        ])
      )
    )

  const isServiceLine = userProfile.id === 'service-line'
  /** Strategy Team, Partnership Admin and Director see Internal Interests and Existing Projects */
  const portfolioRole: StatusRole | null =
    userProfile.id === 'strategy-fit'
      ? 'strategy'
      : userProfile.id === 'partnership-admin'
        ? 'admin'
        : userProfile.id === 'director'
          ? 'director'
          : null
  const navItems = isServiceLine
    ? [
        { id: 'new-interest', label: 'New interest', icon: CirclePlus },
        { id: 'all-interests', label: 'All interests', icon: ListChecks },
      ]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'usage', label: 'Value & ROI', icon: BarChart3 },
        ...(portfolioRole
          ? [
              { id: 'internal-interests', label: 'Internal Interests', icon: Lightbulb },
              { id: 'existing-projects', label: 'Existing Projects', icon: FolderKanban },
            ]
          : []),
      ]

  const handleSignOut = () => {
    setIsAuthenticated(false)
  }

  const handleVendorSubmit = (values: VendorFormValues) => {
    const code = nextCaseCode(requests)
    setRequests((prev) => [buildCaseFromForm(values, code), ...prev])
    return code
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />
  }

  if (userProfile.id === 'vendor') {
    return <VendorWebForm onSubmitCase={handleVendorSubmit} onSignOut={handleSignOut} />
  }

  if (userProfile.id === 'tdd-admin') {
    return (
      <TddAdminApp
        userName={userProfile.name}
        userEmail={userProfile.email}
        onSignOut={handleSignOut}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0d212c] flex font-sans antialiased">
      {/* Expandable/Collapsible Left Navigation Sidebar — Dashboard and Usage Insights */}
      <Sidebar
        items={navItems}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as MainTab)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        userName={userProfile.name}
        userDesignation={userProfile.designation}
        userAvatarUrl={userProfile.avatarUrl}
        onSignOut={handleSignOut}
      />

      {/* Main Body Layout Container */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'pl-[84px]' : 'pl-[250px]'
        }`}
      >
        {/* Top Header Bar — Compact, no subheading, no theme toggle */}
        <header className="w-full bg-white border-b border-[#e2e8f0] px-6 lg:px-10 py-3.5 flex items-center justify-between sticky top-0 z-40 text-[#0d212c] shadow-xs">
          <h1 className="font-semibold text-lg lg:text-xl tracking-tight text-[#0d212c]">
            {TAB_TITLES[activeTab]}
          </h1>
        </header>

        {/* Full-Width Dashboard Content */}
        <main className="flex-1 w-full p-6">
          {isServiceLine && activeTab === 'all-interests' ? (
            <ServiceLineAllInterestsScreen
              interests={serviceLineInterests}
              requests={requests}
              userName={userProfile.name}
            />
          ) : isServiceLine ? (
            <ServiceLineInterestScreen
              interests={serviceLineInterests}
              requests={requests}
              onSubmit={handleInterestSubmit}
            />
          ) : activeTab === 'internal-interests' && portfolioRole ? (
            <InternalInterestsScreen
              interests={serviceLineInterests}
              requests={requests}
              role={portfolioRole}
              onDecide={portfolioRole === 'strategy' ? decideInterest : undefined}
              onRunOverlaps={runInterestOverlaps}
            />
          ) : activeTab === 'existing-projects' && portfolioRole ? (
            <ExistingProjectsScreen
              projects={EXISTING_PROJECTS}
              overlaps={projectOverlaps}
              onRunOverlaps={runProjectOverlaps}
            />
          ) : activeTab === 'usage' ? (
            <UsageInsightsScreen
              requests={requests}
              canRecalculate={userProfile.id === 'partnership-admin'}
              assumptions={usageAssumptions}
              onRecalculate={(next) => {
                setUsageAssumptions(next)
              }}
              customKpis={customKpis}
              onSaveKpi={(kpi) =>
                setCustomKpis((prev) =>
                  prev.some((k) => k.id === kpi.id)
                    ? prev.map((k) => (k.id === kpi.id ? kpi : k))
                    : [...prev, kpi]
                )
              }
              onDeleteKpi={(id) => setCustomKpis((prev) => prev.filter((k) => k.id !== id))}
            />
          ) : (
            <DashboardScreen
              userProfile={userProfile}
              requests={requests}
              onRequestsChange={setRequests}
            />
          )}
        </main>
      </div>
    </div>
  )
}
