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
import { InternalInterestsScreen } from '@/components/screens/InternalInterestsScreen'
import { ExistingProjectsScreen } from '@/components/screens/ExistingProjectsScreen'
import { Sidebar } from '@/components/organisms/Sidebar'
import {
  BarChart3,
  Bot,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  Lightbulb,
  Users,
} from 'lucide-react'
import { PartnershipFormScreen } from '@/tdd-admin/components/screens/PartnershipFormScreen'
import {
  seedFormVersions,
  type FormVersion,
} from '@/tdd-admin/components/screens/partnershipForm.data'
import { UsersScreen } from '@/components/screens/UsersScreen'
import { INITIAL_PLATFORM_USERS, type PlatformUser } from '@/types/platformUsers'
import type { UserDraft } from '@/components/organisms/UserFormModal'
import { AgentsScreen } from '@/tdd-admin/components/screens/AgentsScreen'
import { TddAdminApp } from '@/tdd-admin/TddAdminApp'
import { VendorEvidenceUploaderApp } from '@/tdd-admin/VendorEvidenceUploaderApp'
import {
  INITIAL_PARTNERSHIP_REQUESTS,
  INITIAL_SERVICE_LINE_INTERESTS,
  EXISTING_PROJECTS,
  M42_PEOPLE,
  type ExistingProject,
  type Overlap,
  type PartnershipRequest,
  type ServiceLineInterest,
} from '@/types/partnership.types'
import { buildCaseFromForm, nextCaseCode } from '@/lib/caseActions'
import { nextInterestCode } from '@/lib/serviceLineMatch'
import { findOverlaps } from '@/lib/overlaps'
import type { ProjectDraft } from '@/components/organisms/ProjectFormModal'
import type { InterestEdit } from '@/components/organisms/InterestEditModal'
import type { StatusRole } from '@/lib/caseStatus'
import { DEFAULT_ASSUMPTIONS, type UsageAssumptions } from '@/lib/usageInsights'
import type { CustomKpi } from '@/lib/customKpi'
import type { VendorFormValues } from '@/types/vendorForm'

type MainTab =
  | 'dashboard'
  | 'usage'
  | 'internal-interests'
  | 'existing-projects'
  | 'my-interests'
  | 'agents'
  | 'users'
  | 'request-form'

const TAB_TITLES: Record<MainTab, string> = {
  dashboard: 'Dashboard',
  usage: 'Value and ROI Insights',
  agents: 'Agents',
  users: 'Users',
  'request-form': 'Request Form',
  'internal-interests': 'Internal Interests',
  'existing-projects': 'Existing Projects',
  'my-interests': 'Internal interests',
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
  // The projects M42 already runs; the Strategy Team adds, edits and deletes them
  const [projects, setProjects] = useState<ExistingProject[]>(EXISTING_PROJECTS)
  // Results of the last overlap check on the existing projects, by project id
  const [projectOverlaps, setProjectOverlaps] = useState<Record<string, Overlap[]>>({})
  // The Value/ROI inputs the Partnership Admin last recalculated, shown to every profile
  const [usageAssumptions, setUsageAssumptions] = useState<UsageAssumptions>(DEFAULT_ASSUMPTIONS)
  // KPIs the Partnership Admin built, shown to every profile for the session
  const [customKpis, setCustomKpis] = useState<CustomKpi[]>([])
  // Platform users the Partnership Admin manages
  const [platformUsers, setPlatformUsers] = useState<PlatformUser[]>(INITIAL_PLATFORM_USERS)
  // The request forms are shared by the TDD Admin and the Partnership Admin
  const [formVersions, setFormVersions] = useState<FormVersion[]>(seedFormVersions)
  const [acceptingRequests, setAcceptingRequests] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)

  const handleLogin = (profile: UserProfile) => {
    setUserProfile(profile)
    setActiveTab('dashboard')
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
    interest.overlaps = findOverlaps(interest, serviceLineInterests, projects, requests)
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
      prev.map((i) => ({ ...i, overlaps: findOverlaps(i, prev, projects, requests) }))
    )

  const runProjectOverlaps = () =>
    setProjectOverlaps(
      Object.fromEntries(
        projects.map((p) => [p.id, findOverlaps(p, serviceLineInterests, projects, requests)])
      )
    )

  /** Drops a deleted project or interest from every stored overlap result */
  const forgetOverlaps = (kind: Overlap['kind'], ref: string) => {
    const keep = (list?: Overlap[]) => list?.filter((o) => !(o.kind === kind && o.ref === ref))
    setServiceLineInterests((prev) => prev.map((i) => ({ ...i, overlaps: keep(i.overlaps) })))
    setProjectOverlaps((prev) =>
      Object.fromEntries(
        Object.entries(prev)
          .filter(([id]) => !(kind === 'project' && id === ref))
          .map(([id, list]) => [id, keep(list) ?? []])
      )
    )
  }

  // Strategy Team: existing projects
  const addProject = (draft: ProjectDraft) =>
    setProjects((prev) => {
      const next = Math.max(0, ...prev.map((p) => Number(p.id.replace(/\D/g, '')) || 0)) + 1
      return [...prev, { ...draft, id: `PRJ-${String(next).padStart(2, '0')}` }]
    })
  const editProject = (id: string, draft: ProjectDraft) =>
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...draft, id } : p)))
  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id))
    forgetOverlaps('project', id)
  }

  // Strategy Team: an edited interest; a new status is recorded as their decision
  const editInterest = (code: string, edit: InterestEdit) =>
    setServiceLineInterests((prev) =>
      prev.map((i) => {
        if (i.code !== code) return i
        const statusChanged = edit.status !== i.status
        const decided = edit.status !== 'Pending review'
        return {
          ...i,
          ...edit,
          decidedBy: statusChanged ? (decided ? userProfile.name : undefined) : i.decidedBy,
          decidedOn: statusChanged ? (decided ? todayLabel() : undefined) : i.decidedOn,
          declineReason: edit.status === 'Declined' ? i.declineReason : undefined,
        }
      })
    )
  // Strategy Team: an interest from their own scouting, approved straight away and checked
  // for overlaps like a service line's
  const addStrategyInterest = (draft: InterestEdit) => {
    const code = nextInterestCode(serviceLineInterests)
    const interest: ServiceLineInterest = {
      ...draft,
      code,
      submittedBy: userProfile.name,
      on: todayLabel(),
      status: 'Approved',
      decidedBy: userProfile.name,
      decidedOn: todayLabel(),
      source: 'Strategy scouting',
    }
    interest.overlaps = findOverlaps(interest, serviceLineInterests, projects, requests)
    setServiceLineInterests((prev) => [interest, ...prev])
    return code
  }

  const deleteInterest = (code: string) => {
    setServiceLineInterests((prev) => prev.filter((i) => i.code !== code))
    forgetOverlaps('interest', code)
  }

  /** Vendors to pick from in the project popup: those in the requests and the projects */
  const vendorOptions = [
    ...new Set([...requests.map((r) => r.companyName), ...projects.flatMap((p) => p.vendors)]),
  ].sort((a, b) => a.localeCompare(b))

  /** The Internal Interest Team and the Sponsor raise internal interests */
  const isInternalTeam = userProfile.id === 'evaluator' || userProfile.id === 'sponsor'
  /** Value & ROI is for the Partnership Admin (the TDD Admin has its own view) */
  const canSeeUsage = userProfile.id === 'partnership-admin'
  /** Strategy Team, Partnership Admin and Director see Internal Interests and Existing Projects */
  const portfolioRole: StatusRole | null =
    userProfile.id === 'strategy-fit'
      ? 'strategy'
      : userProfile.id === 'partnership-admin'
        ? 'admin'
        : userProfile.id === 'director'
          ? 'director'
          : null
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(isInternalTeam
      ? [{ id: 'my-interests', label: 'Internal interests', icon: Lightbulb }]
      : []),
    ...(portfolioRole
      ? [
          { id: 'internal-interests', label: 'Internal Interests', icon: Lightbulb },
          { id: 'existing-projects', label: 'Existing Projects', icon: FolderKanban },
        ]
      : []),
    ...(userProfile.id === 'partnership-admin'
      ? [
          { id: 'agents', label: 'Agents', icon: Bot },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'request-form', label: 'Request Form', icon: ClipboardList },
        ]
      : []),
    // Value & ROI always sits last in the left nav
    ...(canSeeUsage ? [{ id: 'usage', label: 'Value & ROI', icon: BarChart3 }] : []),
  ]

  const addUser = (draft: UserDraft) =>
    setPlatformUsers((prev) => [
      {
        ...draft,
        id: `usr-${Date.now()}`,
        assignedRequests: 0,
        status: 'Active',
        lastActive: 'Never',
      },
      ...prev,
    ])
  const editUser = (id: string, draft: UserDraft) =>
    setPlatformUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...draft } : u)))
  const setUserStatus = (id: string, status: PlatformUser['status']) =>
    setPlatformUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)))
  const deleteUser = (id: string) => setPlatformUsers((prev) => prev.filter((u) => u.id !== id))

  const handleSignOut = () => {
    setIsAuthenticated(false)
  }

  const handleVendorSubmit = (values: VendorFormValues) => {
    const code = nextCaseCode(requests)
    const newCase = buildCaseFromForm(values, code, new Date(), requests)
    setRequests((prev) => [newCase, ...prev])
    return { caseId: code, vendorId: newCase.vendorId ?? '' }
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />
  }

  if (userProfile.id === 'vendor') {
    return <VendorWebForm onSubmitCase={handleVendorSubmit} onSignOut={handleSignOut} />
  }

  if (userProfile.id === 'vendor-evidence-uploader') {
    return <VendorEvidenceUploaderApp onSignOut={handleSignOut} />
  }

  if (userProfile.id === 'tdd-admin') {
    return (
      <TddAdminApp
        userName={userProfile.name}
        userEmail={userProfile.email}
        userAvatarUrl={userProfile.avatarUrl}
        requests={requests}
        onRequestsChange={setRequests}
        usageAssumptions={usageAssumptions}
        onRecalculate={setUsageAssumptions}
        formVersions={formVersions}
        onFormVersionsChange={setFormVersions}
        acceptingRequests={acceptingRequests}
        onAcceptingChange={setAcceptingRequests}
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
        <header className="w-full bg-white border-b border-[#e2e8f0] px-6 py-3.5 flex items-center justify-between sticky top-0 z-40 text-[#0d212c] shadow-xs">
          <h1 className="font-semibold text-lg lg:text-xl tracking-tight text-[#0d212c]">
            {TAB_TITLES[activeTab]}
          </h1>
        </header>

        {/* Full-Width Dashboard Content */}
        <main className="flex-1 w-full p-6">
          {activeTab === 'my-interests' && isInternalTeam ? (
            <ServiceLineInterestScreen
              interests={serviceLineInterests}
              requests={requests}
              onSubmit={handleInterestSubmit}
              userName={userProfile.name}
            />
          ) : activeTab === 'internal-interests' && portfolioRole === 'strategy' ? (
            // The Strategy Team raises interests too: New interest, then every interest to decide on
            <ServiceLineInterestScreen
              interests={serviceLineInterests}
              requests={requests}
              onSubmit={(draft) => addStrategyInterest({ ...draft, status: 'Approved' })}
              userName={userProfile.name}
              selfApproved
              allTab={
                <InternalInterestsScreen
                  interests={serviceLineInterests}
                  requests={requests}
                  role={portfolioRole}
                  onDecide={decideInterest}
                  onRunOverlaps={runInterestOverlaps}
                  onAdd={addStrategyInterest}
                  onEdit={editInterest}
                  onDelete={deleteInterest}
                />
              }
            />
          ) : activeTab === 'internal-interests' && portfolioRole ? (
            <InternalInterestsScreen
              interests={serviceLineInterests}
              requests={requests}
              role={portfolioRole}
              onDecide={portfolioRole === 'strategy' ? decideInterest : undefined}
              onRunOverlaps={runInterestOverlaps}
              onAdd={portfolioRole === 'strategy' ? addStrategyInterest : undefined}
              onEdit={portfolioRole === 'strategy' ? editInterest : undefined}
              onDelete={portfolioRole === 'strategy' ? deleteInterest : undefined}
            />
          ) : activeTab === 'existing-projects' && portfolioRole ? (
            <ExistingProjectsScreen
              projects={projects}
              overlaps={projectOverlaps}
              onRunOverlaps={runProjectOverlaps}
              canEdit={portfolioRole === 'strategy'}
              owners={M42_PEOPLE.map((p) => p.name)}
              vendorOptions={vendorOptions}
              onAddProject={addProject}
              onEditProject={editProject}
              onDeleteProject={deleteProject}
            />
          ) : activeTab === 'users' && userProfile.id === 'partnership-admin' ? (
            <UsersScreen
              users={platformUsers}
              onAdd={addUser}
              onEdit={editUser}
              onDelete={deleteUser}
              onSetStatus={setUserStatus}
            />
          ) : activeTab === 'request-form' && userProfile.id === 'partnership-admin' ? (
            <div className="tdd-admin -m-6">
              <PartnershipFormScreen
                versions={formVersions}
                onVersionsChange={setFormVersions}
                acceptingRequests={acceptingRequests}
                onAcceptingChange={setAcceptingRequests}
              />
            </div>
          ) : activeTab === 'agents' && userProfile.id === 'partnership-admin' ? (
            <div className="tdd-admin -m-6">
              <AgentsScreen showRoleSwitch={false} />
            </div>
          ) : activeTab === 'usage' && canSeeUsage ? (
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
