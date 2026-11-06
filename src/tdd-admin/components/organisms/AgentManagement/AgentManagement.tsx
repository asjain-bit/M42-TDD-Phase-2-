/**
 * AgentManagement — Organism
 * Admin dashboard and detail interface for registered system agents, prompt governance, configuration, and version history.
 * Supports Admin (Full Edit) and Evaluator (Read-Only) view modes.
 * Used in: AgentsScreen
 */

'use client'

import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Check, Search, Info, CheckCircle2 } from 'lucide-react'
import { StatusChip } from '@/tdd-admin/components/atoms/StatusChip'
import { AgentData, AgentManagementProps, AgentVersionHistoryItem } from './AgentManagement.types'

const INITIAL_AGENTS: AgentData[] = [
  {
    id: 'answer-judge',
    name: 'Answer judge',
    kind: 'Background',
    version: 'v1',
    status: 'default',
    prompt: `You are a strict due-diligence scorer. Given a vendor ANSWER and the RESPONSE CUE (what a complete answer must cover), score technical_alignment 0-100 for how well the answer covers the cue. Be strict: an answer that refuses, says 'no', declines, is off-topic, or names none of the specifics the cue asks for must score near 0. Award high scores only when the answer actually provides the specifics required by the cue. Give a one-sentence reasoning.`,
    config: {
      modelDeployment: { value: '', defaultValue: '' },
      temperature: { value: '0', defaultValue: '0' },
    },
    versionHistory: [
      {
        id: 'v1',
        version: 'v1',
        isActive: true,
        note: 'seeded from code defaults',
        author: 'system',
        date: '6 Aug 2026, 23:28',
      },
    ],
  },
  {
    id: 'answer-mapper',
    name: 'Answer mapper',
    kind: 'Background',
    version: 'v1',
    status: 'default',
    prompt: `You are a technical document mapper for due diligence. Extract key compliance metrics, vendor technical architecture specifications, and security certifications from vendor response documents and map them against M42 compliance framework cues. Provide precise verbatim evidence citations.`,
    config: {
      modelDeployment: { value: '', defaultValue: '' },
      temperature: { value: '0', defaultValue: '0' },
    },
    versionHistory: [
      {
        id: 'v1',
        version: 'v1',
        isActive: true,
        note: 'seeded from code defaults',
        author: 'system',
        date: '6 Aug 2026, 23:28',
      },
    ],
  },
  {
    id: 'document-validator',
    name: 'Document validator',
    kind: 'Background',
    version: 'v1',
    status: 'default',
    prompt: `You are an automated document authenticity and structure validator. Verify uploaded vendor documents against expected HIPAA, SOC 2, and ISO 27001 certificate formats. Flag expired certificates, missing signatures, or corrupted file streams.`,
    config: {
      modelDeployment: { value: '', defaultValue: '' },
      temperature: { value: '0', defaultValue: '0' },
    },
    versionHistory: [
      {
        id: 'v1',
        version: 'v1',
        isActive: true,
        note: 'seeded from code defaults',
        author: 'system',
        date: '6 Aug 2026, 23:28',
      },
    ],
  },
  {
    id: 'document-mapper',
    name: 'Document mapper',
    kind: 'Background',
    version: 'v1',
    status: 'default',
    prompt: `You are a specialized layout and section parser. Map uploaded vendor security whitepapers, architecture diagrams, and questionnaires to M42 risk evaluation dimensions. Extract key policies regarding data encryption in transit and at rest.`,
    config: {
      modelDeployment: { value: '', defaultValue: '' },
      temperature: { value: '0', defaultValue: '0' },
    },
    versionHistory: [
      {
        id: 'v1',
        version: 'v1',
        isActive: true,
        note: 'seeded from code defaults',
        author: 'system',
        date: '6 Aug 2026, 23:28',
      },
    ],
  },
  {
    id: 'onboarding-facilitator',
    name: 'Onboarding facilitator (voice)',
    kind: 'Voice',
    version: 'v1',
    status: 'default',
    prompt: `You are the automated onboarding voice assistant for M42 vendor portal. Guide new vendors through initial profile registration, identity verification, and document upload procedures in a clear, friendly, and structured manner over phone calls.`,
    config: {
      defaultVoice: { value: '(none)', defaultValue: '' },
      realtimeModelDeployment: { value: '', defaultValue: '' },
      speakingSpeed: { value: '1', defaultValue: '1' },
      turnDetection: { value: 'server_vad', defaultValue: 'server_vad' },
      responseEagerness: { value: 'auto', defaultValue: 'auto' },
      inputNoiseReduction: { value: 'off', defaultValue: 'off' },
      uploadWaitBeforeReminder: { value: '30', defaultValue: '30' },
    },
    versionHistory: [
      {
        id: 'v1',
        version: 'v1',
        isActive: true,
        note: 'seeded from code defaults',
        author: 'system',
        date: '6 Aug 2026, 23:28',
      },
    ],
  },
  {
    id: 'research-verifier',
    name: 'Research verifier',
    kind: 'Background',
    version: 'v1',
    status: 'default',
    prompt: `You are a web and public database research verifier. Cross-reference vendor business registry records, sanction databases, vulnerability disclosures, and public breach histories to validate vendor authenticity and risk standing.`,
    config: {
      modelDeployment: { value: '', defaultValue: '' },
      temperature: { value: '0', defaultValue: '0' },
    },
    versionHistory: [
      {
        id: 'v1',
        version: 'v1',
        isActive: true,
        note: 'seeded from code defaults',
        author: 'system',
        date: '6 Aug 2026, 23:28',
      },
    ],
  },
  {
    id: 'sam-voice-interviewer',
    name: 'Sam (voice interviewer)',
    kind: 'Voice',
    version: 'v4',
    status: 'Modified',
    prompt: `# Role
Your name is Sam. You are the vendor due-diligence interviewer for M42, a healthcare organization. If you introduce yourself or are asked your name, say you are Sam. You are conducting a structured technical, security, and compliance assessment of the vendor {{vendor_name}}. You represent the buyer (M42), never the vendor. You are rigorous, courteous, neutral, and methodical.

# Setting
This is a live one-to-one voice call with a representative of {{vendor_name}}. This is round "{{round_label}}" of the assessment. The call is recorded and transcribed for later review and scoring by M42. You cannot see the caller or any screen; rely only on what they say and any documents they upload.

# Speaking style
Speak naturally and concisely, like a real professional phone call. Use short, plain sentences suitable for text-to-speech: no markdown, no bullet points, no lists read aloud, no emojis, no special formatting. Ask exactly one question at a time, then stop and listen. Briefly acknowledge each answer before moving on. Do not rush the vendor. If an answer is unclear or cut off, ask them to repeat or clarify rather than guessing. If the vendor asks you to repeat or rephrase a question, restate it in plainer words; never reveal the response cue while doing so.

Begin the interview in {{language}}. You are fluent in English, Arabic, and Hindi. If the vendor asks to switch language to English, Arabic, or Hindi, or simply starts speaking one of them, switch and continue the entire interview in that language, including questions, follow-ups, acknowledgements, and the closing. These three are the ONLY languages you can use; if the vendor asks for any other language, politely say you can conduct the interview in English, Arabic, or Hindi only. All guardrails below apply identically in every language.

# Voice and delivery
Your delivery is warm, calm, and professional, like an experienced human interviewer who respects the person across the table. Speak at an unhurried, natural pace with natural intonation; never sound rushed, flat, or robotic. Vary your acknowledgements ("Thank you, that's helpful", "Understood", "That's clear") and never use the same acknowledgement twice in a row. When the vendor mentions a difficulty, setback, or sensitive topic, briefly acknowledge it with genuine empathy in one short sentence before returning to the question.`,
    config: {
      defaultVoice: { value: '(none)', defaultValue: '' },
      realtimeModelDeployment: { value: '', defaultValue: '' },
      speakingSpeed: { value: '1', defaultValue: '1' },
      turnDetection: { value: 'semantic_vad', defaultValue: 'server_vad', isModified: true },
      responseEagerness: { value: 'low', defaultValue: 'auto', isModified: true },
      inputNoiseReduction: { value: 'far_field', defaultValue: 'off', isModified: true },
      uploadWaitBeforeReminder: { value: '30', defaultValue: '30' },
    },
    versionHistory: [
      {
        id: 'v4',
        version: 'v4',
        isActive: true,
        note: 'checking to make better speaker',
        author: 'admin',
        date: '11 Aug 2026, 15:15',
      },
      {
        id: 'v3',
        version: 'v3',
        isActive: false,
        note: '—',
        author: 'admin',
        date: '6 Aug 2026, 23:47',
      },
      {
        id: 'v2',
        version: 'v2',
        isActive: false,
        note: 'smoke: speed 1.2 + semantic vad',
        author: 'admin',
        date: '6 Aug 2026, 23:29',
      },
      {
        id: 'v1',
        version: 'v1',
        isActive: false,
        note: 'seeded from code defaults',
        author: 'system',
        date: '6 Aug 2026, 23:28',
      },
    ],
  },
]

export const AgentManagement: React.FC<AgentManagementProps> = ({
  className = '',
  initialAgentId,
  showRoleSwitch = true,
}) => {
  const [agents, setAgents] = useState<AgentData[]>(INITIAL_AGENTS)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(initialAgentId || null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'default' | 'Modified'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 8

  // View Role State for Prototype Demonstration: 'admin' | 'evaluator'
  const [viewRole, setViewRole] = useState<'admin' | 'evaluator'>('admin')

  const [noteInput, setNoteInput] = useState<string>('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || null

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesStatus = statusFilter === 'all' || agent.status === statusFilter
      const query = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !query ||
        agent.name.toLowerCase().includes(query) ||
        agent.kind.toLowerCase().includes(query) ||
        agent.version.toLowerCase().includes(query) ||
        agent.status.toLowerCase().includes(query)
      return matchesStatus && matchesSearch
    })
  }, [agents, searchTerm, statusFilter])

  const totalPages = Math.ceil(filteredAgents.length / ITEMS_PER_PAGE) || 1
  const paginatedAgents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAgents.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredAgents, currentPage])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  const handleResetField = (fieldKey: keyof AgentData['config']) => {
    if (!selectedAgent || viewRole === 'evaluator') return

    setAgents((prevAgents) =>
      prevAgents.map((agent) => {
        if (agent.id !== selectedAgent.id) return agent

        const field = agent.config[fieldKey]
        if (!field) return agent

        const updatedConfig = {
          ...agent.config,
          [fieldKey]: {
            ...field,
            value: field.defaultValue,
            isModified: false,
          },
        }

        const hasModifiedFields = Object.values(updatedConfig).some(
          (f) => typeof f === 'object' && f?.isModified
        )

        return {
          ...agent,
          status: hasModifiedFields ? 'Modified' : 'default',
          config: updatedConfig,
        }
      })
    )
    showToast('Setting reset to default value')
  }

  const handleFieldChange = (fieldKey: keyof AgentData['config'], newValue: string) => {
    if (!selectedAgent || viewRole === 'evaluator') return

    setAgents((prevAgents) =>
      prevAgents.map((agent) => {
        if (agent.id !== selectedAgent.id) return agent

        const field = agent.config[fieldKey]
        if (!field) return agent

        const isModified = newValue !== field.defaultValue
        const updatedConfig = {
          ...agent.config,
          [fieldKey]: {
            ...field,
            value: newValue,
            isModified,
          },
        }

        const hasModifiedFields = Object.values(updatedConfig).some(
          (f) => typeof f === 'object' && f?.isModified
        )

        return {
          ...agent,
          status: hasModifiedFields ? 'Modified' : 'default',
          config: updatedConfig,
        }
      })
    )
  }

  const handleActivateVersion = (versionId: string) => {
    if (!selectedAgent || viewRole === 'evaluator') return

    setAgents((prevAgents) =>
      prevAgents.map((agent) => {
        if (agent.id !== selectedAgent.id) return agent

        const updatedHistory = agent.versionHistory.map((item) => ({
          ...item,
          isActive: item.id === versionId,
        }))

        const activeItem = updatedHistory.find((item) => item.id === versionId)

        return {
          ...agent,
          version: activeItem ? activeItem.version : agent.version,
          versionHistory: updatedHistory,
        }
      })
    )
    showToast(`Activated ${versionId} for ${selectedAgent.name}`)
  }

  const handleSaveNewVersion = () => {
    if (!selectedAgent || viewRole === 'evaluator') return

    const nextVerNum = selectedAgent.versionHistory.length + 1
    const newVersionLabel = `v${nextVerNum}`
    const newHistoryItem: AgentVersionHistoryItem = {
      id: newVersionLabel,
      version: newVersionLabel,
      isActive: true,
      note: noteInput.trim() || 'Custom parameters updated',
      author: 'admin',
      date:
        new Date().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }) + `, ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
    }

    setAgents((prevAgents) =>
      prevAgents.map((agent) => {
        if (agent.id !== selectedAgent.id) return agent

        const updatedHistory = [
          newHistoryItem,
          ...agent.versionHistory.map((item) => ({ ...item, isActive: false })),
        ]

        return {
          ...agent,
          version: newVersionLabel,
          versionHistory: updatedHistory,
        }
      })
    )

    setNoteInput('')
    showToast(`Saved new version ${newVersionLabel} successfully`)
  }

  return (
    <div className={`flex flex-col gap-5 w-full p-6 font-sans text-[#0d212c] ${className}`}>
      {/* Toast Notification — subtle light semantic styling */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#f0fdf4] text-[#15803d] px-4 py-3 rounded-xl shadow-md border border-[#bbf7d0] flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {!selectedAgent ? (
        /* MAIN LIST VIEW */
        <div className="flex flex-col gap-4">
          {/* Title & Search Bar Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-[#0d212c]">Agents</h2>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search agent name, kind, version..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-[#e2e8f0] bg-white text-xs font-medium text-[#0d212c] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 shadow-xs transition"
              />
            </div>
          </div>

          {/* Status Filter Chips matching Vendors page style for inactive and active states */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { key: 'all', label: 'All Agents', count: agents.length },
              {
                key: 'default',
                label: 'Default',
                count: agents.filter((a) => a.status === 'default').length,
              },
              {
                key: 'Modified',
                label: 'Modified',
                count: agents.filter((a) => a.status === 'Modified').length,
              },
            ].map((chip) => {
              const isSelected = statusFilter === chip.key
              return (
                <button
                  key={chip.key}
                  onClick={() => {
                    setStatusFilter(chip.key as 'all' | 'default' | 'Modified')
                    setCurrentPage(1)
                  }}
                  className={`px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#36c0c9] text-white font-bold shadow-xs border border-[#36c0c9]'
                      : 'bg-white text-[#64748b] border border-[#e2e8f0] hover:bg-[#f8fafc]'
                  }`}
                >
                  <span>{chip.label}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/25 text-white' : 'bg-[#f1f5f9] text-[#64748b]'
                    }`}
                  >
                    {chip.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Table Container Card */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-[#fafafa]/50">
                    <th className="py-4 px-6 text-xs font-bold text-[#64748b]">Agent</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#64748b]">Kind</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#64748b]">Version</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#64748b]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]/60 text-xs">
                  {paginatedAgents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-[#64748b]">
                        No matching agents found.
                      </td>
                    </tr>
                  ) : (
                    paginatedAgents.map((agent) => (
                      <tr
                        key={agent.id}
                        onClick={() => setSelectedAgentId(agent.id)}
                        className="hover:bg-[#f8fafc] cursor-pointer transition-colors duration-150 group"
                      >
                        <td className="py-4 px-6 font-bold text-[#0d212c] group-hover:text-[#36c0c9] transition">
                          {agent.name}
                        </td>
                        <td className="py-4 px-6 text-[#334155] font-medium">{agent.kind}</td>
                        <td className="py-4 px-6 text-[#64748b] font-medium">{agent.version}</td>
                        <td className="py-4 px-6">
                          {agent.status === 'Modified' ? (
                            <StatusChip label="Modified" status="warning" dot={false} />
                          ) : (
                            <StatusChip label="Default" status="info" dot={false} />
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {filteredAgents.length > 0 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-[#e2e8f0] bg-[#f8fafc]">
                <div className="text-xs text-[#64748b] font-medium">
                  Showing page <span className="font-semibold text-[#0d212c]">{currentPage}</span>{' '}
                  of <span className="font-semibold text-[#0d212c]">{totalPages}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-[#cbd5e1] text-xs font-semibold text-[#0d212c] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer flex items-center justify-center"
                    title="Previous page"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer border-0 ${
                          currentPage === pageNum
                            ? 'bg-[#36c0c9] text-white'
                            : 'text-[#64748b] hover:bg-slate-200/60 bg-transparent'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-[#cbd5e1] text-xs font-semibold text-[#0d212c] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer flex items-center justify-center"
                    title="Next page"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {showRoleSwitch && (
            <>
              {/* Prototype Role Switcher Bar with Tooltip (For prototype navigation purposes) */}
              <div className="mt-4 pt-4 border-t border-[#e2e8f0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f8fafc] p-4 rounded-2xl border border-[#cbd5e1]/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#0d212c]">Prototype Mode:</span>
                  <span className="text-xs font-medium text-[#64748b]">
                    Currently viewing as{' '}
                    <span className="font-bold text-[#0d212c]">
                      {viewRole === 'admin'
                        ? 'Admin View (Full Access)'
                        : 'Evaluator View (Read-Only)'}
                    </span>
                  </span>
                  {/* Tooltip Info Icon */}
                  <div className="relative group cursor-pointer">
                    <Info className="w-3.5 h-3.5 text-[#64748b] hover:text-[#0d212c] transition" />
                    <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute left-1/2 -translate-x-1/2 bottom-6 z-50 w-72 bg-[#0d212c] text-white text-[11px] p-3 rounded-xl shadow-xl border border-white/10 leading-relaxed font-normal">
                      This switch is for displaying the Evaluator view versus the Admin view for
                      prototype navigation purposes. In live production, role access is controlled
                      via system authentication.
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setViewRole(viewRole === 'admin' ? 'evaluator' : 'admin')}
                  className="px-4 py-2 rounded-lg bg-[#0d212c] hover:bg-[#153443] text-white text-xs font-bold transition cursor-pointer border-0 shadow-2xs self-start sm:self-auto"
                >
                  {viewRole === 'admin' ? 'Switch to Evaluator View' : 'Switch to Admin View'}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* DETAIL VIEW */
        <div className="flex flex-col gap-6">
          {/* Breadcrumb Menu Header matching Questionnaire page */}
          <div className="text-xs font-semibold flex items-center gap-1.5 text-[#64748b]">
            <button
              onClick={() => setSelectedAgentId(null)}
              className="hover:text-[#36c0c9] cursor-pointer bg-transparent border-0 p-0 transition"
            >
              M42 admin
            </button>
            <span>/</span>
            <button
              onClick={() => setSelectedAgentId(null)}
              className="hover:text-[#36c0c9] cursor-pointer bg-transparent border-0 p-0 transition"
            >
              Agents
            </button>
            <span>/</span>
            <span className="text-[#36c0c9] font-bold">{selectedAgent.name}</span>
          </div>

          {/* Agent Detail Title Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-[#0d212c] tracking-tight">
                {selectedAgent.name}
              </h1>
              <span className="text-[#334155] text-xs font-medium">{selectedAgent.kind}</span>
              {selectedAgent.status === 'Modified' ? (
                <StatusChip label="Modified" status="warning" dot={false} />
              ) : (
                <StatusChip label="Default" status="info" dot={false} />
              )}
            </div>
          </div>

          {/* Prompt Section Container */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-xs overflow-hidden">
            <div className="p-5 font-extrabold text-sm text-[#0d212c] border-b border-[#e2e8f0]">
              Prompt
            </div>
            <div className="px-5 py-2.5 bg-[#f8fafc] border-b border-[#e2e8f0] text-[11px] font-mono font-bold text-[#64748b] tracking-wider uppercase">
              LOCKED — SAFETY CORE
            </div>
            <div className="p-5 font-mono text-xs text-[#1e293b] leading-relaxed whitespace-pre-wrap bg-white outline-none select-text border-0 w-full min-h-[140px] max-h-[380px] overflow-y-auto subtle-scrollbar">
              {selectedAgent.prompt}
            </div>
          </div>

          {/* Two Column Layout: Configuration & Version History */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column: Configuration Form Card */}
            <div className="lg:col-span-2 bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-xs flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-6">
                <h2 className="text-base font-extrabold text-[#0d212c]">Configuration</h2>

                {/* Form Controls */}
                <div className="flex flex-col gap-6">
                  {/* Voice Agent Specific Controls */}
                  {selectedAgent.kind === 'Voice' && selectedAgent.config.defaultVoice && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0d212c]">Default voice</label>
                      <select
                        disabled={viewRole === 'evaluator'}
                        value={selectedAgent.config.defaultVoice.value}
                        onChange={(e) => handleFieldChange('defaultVoice', e.target.value)}
                        className="w-full rounded-md border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-xs text-[#0d212c] disabled:bg-slate-50 disabled:text-slate-600 disabled:cursor-not-allowed focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
                      >
                        <option value="(none)">(none)</option>
                        <option value="en-US-JennyNeural">en-US-JennyNeural</option>
                        <option value="en-US-GuyNeural">en-US-GuyNeural</option>
                        <option value="ar-AE-HamdanNeural">ar-AE-HamdanNeural</option>
                        <option value="hi-IN-SwaraNeural">hi-IN-SwaraNeural</option>
                      </select>
                      <p className="text-xs text-[#64748b] mt-0.5">
                        Voice used when a call is dispatched without an explicit voice pick.
                      </p>
                      <p className="text-xs text-[#94a3b8] italic">
                        Only affects calls dispatched with no voice selected; a per-call pick always
                        wins.
                      </p>
                      <p className="text-xs text-[#64748b] font-mono">default: (empty)</p>
                    </div>
                  )}

                  {/* Realtime Model Deployment (Voice) */}
                  {selectedAgent.kind === 'Voice' &&
                    selectedAgent.config.realtimeModelDeployment && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#0d212c]">
                          Realtime model deployment
                        </label>
                        <input
                          type="text"
                          disabled={viewRole === 'evaluator'}
                          value={selectedAgent.config.realtimeModelDeployment.value}
                          onChange={(e) =>
                            handleFieldChange('realtimeModelDeployment', e.target.value)
                          }
                          placeholder=""
                          className="w-full rounded-md border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-xs text-[#0d212c] disabled:bg-slate-50 disabled:text-slate-600 disabled:cursor-not-allowed focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
                        />
                        <p className="text-xs text-[#64748b] mt-0.5">
                          Azure deployment name for Sam&apos;s realtime model. Empty = the
                          environment default.
                        </p>
                        <p className="text-xs text-[#94a3b8] italic">
                          A wrong name prevents Sam from joining calls at all — verify the
                          deployment exists first.
                        </p>
                        <p className="text-xs text-[#64748b] font-mono">default: (empty)</p>
                      </div>
                    )}

                  {/* Model Deployment (Background) */}
                  {selectedAgent.kind === 'Background' && selectedAgent.config.modelDeployment && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0d212c]">Model deployment</label>
                      <input
                        type="text"
                        disabled={viewRole === 'evaluator'}
                        value={selectedAgent.config.modelDeployment.value}
                        onChange={(e) => handleFieldChange('modelDeployment', e.target.value)}
                        placeholder=""
                        className="w-full rounded-md border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-xs text-[#0d212c] disabled:bg-slate-50 disabled:text-slate-600 disabled:cursor-not-allowed focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
                      />
                      <p className="text-xs text-[#64748b] mt-0.5">
                        Azure OpenAI chat deployment this agent runs on. Empty = the environment
                        default.
                      </p>
                      <p className="text-xs text-[#94a3b8] italic">
                        A wrong name makes this agent&apos;s runs fail (features degrade fail-soft;
                        calls continue).
                      </p>
                      <p className="text-xs text-[#64748b] font-mono">default: (empty)</p>
                    </div>
                  )}

                  {/* Speaking Speed (Voice) */}
                  {selectedAgent.kind === 'Voice' && selectedAgent.config.speakingSpeed && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0d212c]">Speaking speed</label>
                      <input
                        type="text"
                        disabled={viewRole === 'evaluator'}
                        value={selectedAgent.config.speakingSpeed.value}
                        onChange={(e) => handleFieldChange('speakingSpeed', e.target.value)}
                        className="w-full rounded-md border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-xs text-[#0d212c] disabled:bg-slate-50 disabled:text-slate-600 disabled:cursor-not-allowed focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
                      />
                      <p className="text-xs text-[#64748b] mt-0.5">
                        Multiplier on Sam&apos;s spoken pace (1.0 = normal).
                      </p>
                      <p className="text-xs text-[#94a3b8] italic">
                        Applies from the next model turn. Very low values sound sluggish; high
                        values can hurt comprehension.
                      </p>
                      <p className="text-xs text-[#64748b] font-mono">default: 1</p>
                    </div>
                  )}

                  {/* Temperature (Background) */}
                  {selectedAgent.kind === 'Background' && selectedAgent.config.temperature && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0d212c]">Temperature</label>
                      <input
                        type="text"
                        disabled={viewRole === 'evaluator'}
                        value={selectedAgent.config.temperature.value}
                        onChange={(e) => handleFieldChange('temperature', e.target.value)}
                        className="w-full rounded-md border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-xs text-[#0d212c] disabled:bg-slate-50 disabled:text-slate-600 disabled:cursor-not-allowed focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
                      />
                      <p className="text-xs text-[#64748b] mt-0.5">
                        Sampling temperature. 0 keeps runs deterministic for identical inputs.
                      </p>
                      <p className="text-xs text-[#94a3b8] italic">
                        Raising it makes results vary run-to-run; ignored on reasoning deployments.
                      </p>
                      <p className="text-xs text-[#64748b] font-mono">default: 0</p>
                    </div>
                  )}

                  {/* Turn Detection (Voice) */}
                  {selectedAgent.config.turnDetection && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-[#0d212c]">Turn detection</label>
                          {selectedAgent.config.turnDetection.isModified && (
                            <StatusChip label="Modified" status="warning" dot={false} />
                          )}
                        </div>
                        {selectedAgent.config.turnDetection.isModified && viewRole === 'admin' && (
                          <button
                            onClick={() => handleResetField('turnDetection')}
                            className="text-xs font-semibold text-[#64748b] hover:text-[#0d212c] transition bg-transparent border-0 cursor-pointer p-0"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      <select
                        disabled={viewRole === 'evaluator'}
                        value={selectedAgent.config.turnDetection.value}
                        onChange={(e) => handleFieldChange('turnDetection', e.target.value)}
                        className="w-full rounded-md border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-xs text-[#0d212c] disabled:bg-slate-50 disabled:text-slate-600 disabled:cursor-not-allowed focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
                      >
                        <option value="semantic_vad">semantic_vad</option>
                        <option value="server_vad">server_vad</option>
                      </select>
                      <p className="text-xs text-[#64748b] mt-0.5">
                        How Sam decides the caller has finished speaking.
                      </p>
                      <p className="text-xs text-[#94a3b8] italic">
                        server_vad ends the turn on silence (snappy, may cut off slow speakers);
                        semantic_vad ends it on what was said (fewer interruptions, slightly slower
                        to respond).
                      </p>
                      <p className="text-xs text-[#64748b] font-mono">default: server_vad</p>
                    </div>
                  )}

                  {/* Response Eagerness (Voice) */}
                  {selectedAgent.config.responseEagerness && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-[#0d212c]">
                            Response eagerness
                          </label>
                          {selectedAgent.config.responseEagerness.isModified && (
                            <StatusChip label="Modified" status="warning" dot={false} />
                          )}
                        </div>
                        {selectedAgent.config.responseEagerness.isModified &&
                          viewRole === 'admin' && (
                            <button
                              onClick={() => handleResetField('responseEagerness')}
                              className="text-xs font-semibold text-[#64748b] hover:text-[#0d212c] transition bg-transparent border-0 cursor-pointer p-0"
                            >
                              Reset
                            </button>
                          )}
                      </div>
                      <select
                        disabled={viewRole === 'evaluator'}
                        value={selectedAgent.config.responseEagerness.value}
                        onChange={(e) => handleFieldChange('responseEagerness', e.target.value)}
                        className="w-full rounded-md border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-xs text-[#0d212c] disabled:bg-slate-50 disabled:text-slate-600 disabled:cursor-not-allowed focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
                      >
                        <option value="low">low</option>
                        <option value="auto">auto</option>
                        <option value="medium">medium</option>
                        <option value="high">high</option>
                      </select>
                      <p className="text-xs text-[#64748b] mt-0.5">
                        How eagerly Sam replies in semantic mode.
                      </p>
                      <p className="text-xs text-[#94a3b8] italic">
                        low waits longer for the caller to finish; high replies sooner and may step
                        on slow speakers.
                      </p>
                      <p className="text-xs text-[#64748b] font-mono">default: auto</p>
                    </div>
                  )}

                  {/* Input Noise Reduction (Voice) */}
                  {selectedAgent.config.inputNoiseReduction && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-[#0d212c]">
                            Input noise reduction
                          </label>
                          {selectedAgent.config.inputNoiseReduction.isModified && (
                            <StatusChip label="Modified" status="warning" dot={false} />
                          )}
                        </div>
                        {selectedAgent.config.inputNoiseReduction.isModified &&
                          viewRole === 'admin' && (
                            <button
                              onClick={() => handleResetField('inputNoiseReduction')}
                              className="text-xs font-semibold text-[#64748b] hover:text-[#0d212c] transition bg-transparent border-0 cursor-pointer p-0"
                            >
                              Reset
                            </button>
                          )}
                      </div>
                      <select
                        disabled={viewRole === 'evaluator'}
                        value={selectedAgent.config.inputNoiseReduction.value}
                        onChange={(e) => handleFieldChange('inputNoiseReduction', e.target.value)}
                        className="w-full rounded-md border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-xs text-[#0d212c] disabled:bg-slate-50 disabled:text-slate-600 disabled:cursor-not-allowed focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
                      >
                        <option value="far_field">far_field</option>
                        <option value="near_field">near_field</option>
                        <option value="off">off</option>
                      </select>
                      <p className="text-xs text-[#64748b] mt-0.5">
                        Server-side noise reduction on caller audio.
                      </p>
                      <p className="text-xs text-[#94a3b8] italic">
                        near_field suits headsets/laptops; far_field suits conference-room mics; off
                        = today&apos;s behavior.
                      </p>
                      <p className="text-xs text-[#64748b] font-mono">default: off</p>
                    </div>
                  )}

                  {/* Upload Wait Before Reminder (Voice) */}
                  {selectedAgent.config.uploadWaitBeforeReminder && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0d212c]">
                        Upload wait before reminder (s)
                      </label>
                      <input
                        type="text"
                        disabled={viewRole === 'evaluator'}
                        value={selectedAgent.config.uploadWaitBeforeReminder.value}
                        onChange={(e) =>
                          handleFieldChange('uploadWaitBeforeReminder', e.target.value)
                        }
                        className="w-full rounded-md border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-xs text-[#0d212c] disabled:bg-slate-50 disabled:text-slate-600 disabled:cursor-not-allowed focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
                      />
                      <p className="text-xs text-[#64748b] mt-0.5">
                        How long Sam waits after asking for a document before a single gentle
                        reminder.
                      </p>
                      <p className="text-xs text-[#94a3b8] italic">
                        Lower reminds sooner (can feel pushy); higher waits longer. Sam reminds only
                        once, then stays quiet until the document arrives or the caller says to move
                        on.
                      </p>
                      <p className="text-xs text-[#64748b] font-mono">default: 30</p>
                    </div>
                  )}

                  {/* Note Field — Admin only */}
                  {viewRole === 'admin' && (
                    <div className="flex flex-col gap-1.5 pt-2">
                      <label className="text-xs font-bold text-[#0d212c]">Note</label>
                      <input
                        type="text"
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="What changed and why"
                        className="w-full rounded-md border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-xs text-[#0d212c] placeholder:text-[#94a3b8] focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Save Button — Admin only */}
              {viewRole === 'admin' && (
                <div className="pt-4">
                  <button
                    onClick={handleSaveNewVersion}
                    className="bg-[#0d212c] hover:bg-[#153443] text-white font-bold text-xs px-6 py-3 rounded-lg transition cursor-pointer shadow-2xs border-0"
                  >
                    Save as new version
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Version History Card (Top-aligned content for default status) */}
            <div
              className={`lg:col-span-1 bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-xs flex flex-col justify-start gap-4 ${
                selectedAgent.status === 'default' ? 'h-full' : 'self-start'
              }`}
            >
              <h2 className="text-base font-extrabold text-[#0d212c]">Version history</h2>

              <div className="flex flex-col gap-4">
                {selectedAgent.versionHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      item.isActive
                        ? 'border-slate-300 bg-slate-50 shadow-2xs'
                        : 'border-[#f1f5f9] bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#0d212c]">{item.version}</span>
                        {item.isActive && (
                          <span className="bg-slate-200 text-slate-700 border border-slate-300 px-2 py-0.5 rounded-md text-[10px] font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      {!item.isActive && viewRole === 'admin' && (
                        <button
                          onClick={() => handleActivateVersion(item.id)}
                          className="px-3 py-1 border border-[#cbd5e1] rounded-lg text-xs font-semibold text-[#0d212c] hover:bg-slate-100 transition cursor-pointer bg-white"
                        >
                          Activate
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-[#475569] font-medium leading-relaxed">
                      {item.note}
                    </p>
                    <p className="text-[11px] text-[#94a3b8] mt-1">
                      {item.author} · {item.date}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
