'use client'

import React, { useState } from 'react'
import {
  Fingerprint,
  Loader2,
  ShieldCheck,
  Users,
  PieChart,
  Lock,
  ArrowLeft,
  Info,
} from 'lucide-react'

export interface UserProfile {
  id: string
  name: string
  designation: string
  email: string
  roleTitle: string
  avatarUrl?: string
}

export const AVAILABLE_PROFILES: UserProfile[] = [
  {
    id: 'vendor',
    name: 'Vendor',
    designation: 'Vendor Web Form',
    email: 'Public partnership request form',
    roleTitle: 'Vendor Web Form',
  },
  {
    id: 'partnership-admin',
    name: 'Nadia Al-Farsi',
    designation: 'Partnership Admin',
    email: 'nadia.alfarsi@m42.ae',
    roleTitle: 'Partnership Admin',
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'director',
    name: 'Zaid Al Ali',
    designation: 'Director',
    email: 'zaid.alali@m42.ae',
    roleTitle: 'Director',
    avatarUrl:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'evaluator',
    name: 'Mariam Al-Zaabi',
    designation: 'Internal Interest Team',
    email: 'mariam.alzaabi@m42.ae',
    roleTitle: 'Internal Interest Team',
    avatarUrl:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'strategy-fit',
    // A role, not a person: different people review strategy on different cases
    name: 'Strategy Team',
    designation: 'Strategy Team',
    email: 'strategy@m42.ae',
    roleTitle: 'Strategy Team',
  },
  {
    id: 'sponsor',
    name: 'Rashid Al-Nuaimi',
    designation: 'Sponsor',
    email: 'rashid.alnuaimi@m42.ae',
    roleTitle: 'Sponsor',
    avatarUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'service-line',
    name: 'Hamad Al Suwaidi',
    designation: 'Service Line Team',
    email: 'hamad.alsuwaidi@m42.ae',
    roleTitle: 'Service Line Team',
  },
  {
    id: 'tdd-admin',
    name: 'Zaid Al Ali',
    designation: 'TDD Admin',
    email: 'zaid.alali@m42.ae',
    roleTitle: 'TDD Admin',
    avatarUrl:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'legal-director',
    name: 'Fatima Al-Kaabi',
    designation: 'Legal Team',
    email: 'fatima.alkaabi@m42.ae',
    roleTitle: 'Legal Team',
    avatarUrl:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  },
]

interface LoginScreenProps {
  onLogin: (profile: UserProfile) => void
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [currentStep, setCurrentStep] = useState<'welcome' | 'select-profile'>('welcome')
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const handleSelectProfile = (profile: UserProfile) => {
    setSelectedProfile(profile)
    setIsAuthenticating(true)
    setTimeout(() => {
      onLogin(profile)
    }, 700)
  }

  if (isAuthenticating && selectedProfile) {
    return (
      <div className="fixed inset-0 bg-[#f8f9fc] flex items-center justify-center z-50 animate-in fade-in duration-200">
        <div className="flex flex-col items-center text-center max-w-sm px-4">
          <div className="text-[#0d212c] mb-4">
            <Loader2 className="w-12 h-12 animate-spin text-[#0d212c]" />
          </div>
          <h2 className="text-[20px] font-medium text-[#0d212c] mb-2">
            Setting up your workspace...
          </h2>
          <p className="text-[14px] text-slate-500">
            Preparing the M42 Tech Due Diligence environment for{' '}
            <strong className="text-[#0d212c]">{selectedProfile.roleTitle}</strong>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#f8f9fc] font-sans antialiased text-[#0d212c]">
      {/* Left Side — Information Panel with requested #D9E6EB background color */}
      <div className="flex-1 p-8 lg:p-16 flex flex-col justify-center relative bg-[#D9E6EB] border-r border-[#e2e8f0]">
        <div className="max-w-md mx-auto w-full flex flex-col gap-8">
          {/* Header Brand: Dark Logo PNG without background */}
          <div className="flex items-center gap-3">
            <img
              src="/dark-logo.png"
              alt="M42 logo"
              className="h-8 w-auto object-contain shrink-0"
            />
            <h1 className="font-medium text-xl text-[#0d212c] tracking-tight">
              Tech Due Diligence
            </h1>
          </div>

          <div>
            <h2 className="text-[24px] font-semibold text-[#0d212c] tracking-tight leading-snug">
              From partnership request to strategic collaboration.
            </h2>
          </div>

          {/* Feature points */}
          <div className="space-y-6 pt-2">
            <div className="flex items-start gap-3.5">
              <ShieldCheck className="w-6 h-6 text-[#0f766e] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-[#0d212c] text-sm">Intelligent screening</h3>
                <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                  AI-assisted assessment to identify relevant, high-potential partnership
                  opportunities.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <Users className="w-6 h-6 text-[#0f766e] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-[#0d212c] text-sm">Cross-functional alignment</h3>
                <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                  Connect internal experts and strategy teams to evaluate opportunities together.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <PieChart className="w-6 h-6 text-[#0f766e] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-[#0d212c] text-sm">End-to-end visibility</h3>
                <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                  Track reviews, decisions, and partnership progress in one centralized workspace.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side — Login & Profile Selection Panel */}
      <div className="flex-1 bg-white p-6 lg:p-12 flex items-center justify-center overflow-y-auto">
        {currentStep === 'welcome' ? (
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 p-8 sm:p-12 text-center shadow-xs flex flex-col items-center">
            {/* Welcome Text */}
            <h2 className="text-2xl font-semibold text-[#0d212c] mb-2 tracking-tight">Welcome</h2>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-sm mx-auto">
              Sign in with your organisational account
            </p>

            {/* Sign in with SSO Action Button — opens Profile View list */}
            <button
              onClick={() => setCurrentStep('select-profile')}
              className="w-full flex items-start gap-3 bg-white border border-gray-200 rounded-xl px-4 py-4 text-left shadow-xs hover:shadow-md hover:border-[#36c0c9]/30 transition-all group cursor-pointer mb-6"
            >
              <div className="mt-0.5 bg-gray-50 p-2 rounded-lg group-hover:bg-[#36c0c9]/10 transition-colors">
                <Fingerprint className="w-5 h-5 text-gray-500 group-hover:text-[#36c0c9] transition-colors" />
              </div>
              <div className="mt-1">
                <div className="font-medium text-[15px] text-[#0d212c] group-hover:text-[#36c0c9] transition-colors">
                  Sign in with SSO
                </div>
                <div className="text-[13px] text-gray-500 mt-0.5">
                  Authenticate via your enterprise network
                </div>
              </div>
            </button>

            {/* Protected Note Text */}
            <div className="flex items-start justify-center gap-2 text-xs text-slate-500 text-left sm:text-center w-full">
              <Lock className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
              <span>
                Protected by your organization&apos;s Single Sign-On.{' '}
                <span className="block sm:inline">
                  Need help?{' '}
                  <a
                    href="mailto:support@m42.ae"
                    onClick={(e) => {
                      e.preventDefault()
                      alert('For SSO support, contact support@m42.ae')
                    }}
                    className="text-[#0f766e] font-medium hover:underline inline-block"
                  >
                    Contact your administrator.
                  </a>
                </span>
              </span>
            </div>
          </div>
        ) : (
          /* Step 2: Role / Profile Selection View */
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentStep('welcome')}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#0d212c] transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to sign in</span>
              </button>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#0d212c] tracking-tight">
                Select Profile
              </h2>
              <div className="relative group inline-flex items-center">
                <div
                  tabIndex={0}
                  role="button"
                  aria-label="Prototype navigation note"
                  className="flex items-center justify-center cursor-default outline-none text-slate-400 select-none"
                >
                  <Info className="w-4 h-4 text-slate-400" />
                </div>
                <div className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-64 p-2.5 bg-[#0d212c] text-white text-[11px] font-medium leading-relaxed rounded-xl shadow-xl text-center">
                  This is for the prototype navigation purpose not to be included in the actual
                  developed application.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0d212c]" />
                </div>
              </div>
            </div>

            {/* List of Profile Views: only role and user email, accessible profiles can enter */}
            <div className="flex flex-col gap-2.5">
              {AVAILABLE_PROFILES.filter((profile) => profile.id !== 'legal-director').map(
                (profile) => {
                  const isAccessible =
                    profile.id === 'vendor' ||
                    profile.id === 'partnership-admin' ||
                    profile.id === 'director' ||
                    profile.id === 'evaluator' ||
                    profile.id === 'strategy-fit' ||
                    profile.id === 'sponsor' ||
                    profile.id === 'service-line' ||
                    profile.id === 'tdd-admin'

                  if (isAccessible) {
                    return (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => handleSelectProfile(profile)}
                        className="w-full text-left p-3.5 rounded-xl border border-gray-200 hover:border-[#36c0c9] hover:bg-[#36c0c9]/5 transition-all flex flex-col gap-0.5 group cursor-pointer shadow-2xs hover:shadow-xs"
                      >
                        <span className="font-semibold text-sm text-[#0d212c] group-hover:text-[#36c0c9] transition-colors truncate">
                          {profile.roleTitle}
                        </span>
                        <span className="text-xs text-slate-500 truncate">{profile.email}</span>
                      </button>
                    )
                  }

                  return (
                    <div
                      key={profile.id}
                      className="w-full text-left p-3.5 rounded-xl border border-gray-200 bg-white flex flex-col gap-0.5 shadow-2xs cursor-default select-none"
                    >
                      <span className="font-semibold text-sm text-[#0d212c] truncate">
                        {profile.roleTitle}
                      </span>
                      <span className="text-xs text-slate-500 truncate">{profile.email}</span>
                    </div>
                  )
                }
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400 text-center">
              <Lock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span>Session credentials authenticated via M42 SSO Gateway</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
