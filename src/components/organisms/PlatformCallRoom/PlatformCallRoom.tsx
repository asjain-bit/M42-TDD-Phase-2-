'use client'

/**
 * PlatformCallRoom — Organism
 * A discovery or value call held on the platform: set-up with any number of attendees, consent,
 * the room with a listening agent that never speaks, then the agent's structured summary.
 * Used in: DiscoveryCallStage, ValueDueDiligenceStage
 */

import React, { useEffect, useMemo, useState } from 'react'
import {
  Bot,
  Ear,
  LogOut,
  Mic,
  MicOff,
  PhoneOff,
  Search,
  ShieldCheck,
  Users,
  Video,
  X,
} from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Checkbox } from '@/components/atoms/Checkbox'
import { Radio } from '@/components/atoms/Radio'
import { Input } from '@/components/atoms/Input'
import { CopyButton } from '@/components/molecules/CopyButton'
import { ThinkingMode } from '@/components/organisms/ThinkingMode'
import { M42_PEOPLE, type CallAttendee } from '@/types/partnership.types'
import type { PlatformCallRoomProps } from './PlatformCallRoom.types'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const SUMMARY_MESSAGES = [
  'Reading the call transcript',
  'Pulling out commitments and open questions',
  'Writing the meeting summary',
]

const SAMPLE_TRANSCRIPT: Record<'discovery' | 'value', { who: string; text: string }[]> = {
  discovery: [
    { who: 'Director', text: 'Thanks for joining. Could you walk us through the solution?' },
    { who: 'Vendor', text: 'Of course. It flags at-risk patients from routine data in minutes.' },
    { who: 'Clinical lead', text: 'Where would the model run, and where is the data stored?' },
    { who: 'Vendor', text: 'In a UAE region; we can confirm hosting options in writing.' },
  ],
  value: [
    { who: 'Sponsor', text: 'Let us agree what success looks like for the pilot.' },
    { who: 'Vendor', text: 'We expect turnaround to drop by a third at the pilot site.' },
    { who: 'Finance', text: 'What would scale-up cost after the pilot?' },
    { who: 'Vendor', text: 'We will send pilot and scale-up pricing this week.' },
  ],
}

const initialsOf = (name: string) =>
  name
    .replace(/^Dr\.\s*/, '')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')

/** The saved summary, one labelled list per heading */
const Summary: React.FC<{ call: NonNullable<PlatformCallRoomProps['saved']> }> = ({ call }) => {
  const sections: [string, string[]][] = [
    ['Attendees', call.summary.attendees],
    ['Key points', call.summary.keyPoints],
    ['Vendor commitments', call.summary.vendorCommitments],
    ['Open questions', call.summary.openQuestions],
    ['Risks', call.summary.risks],
    ['Next steps', call.summary.nextSteps],
  ]
  return (
    <section
      aria-labelledby="call-summary-heading"
      className="rounded-xl border border-border-default bg-bg-default p-5 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-text-secondary" strokeWidth={2} aria-hidden="true" />
          <h3 id="call-summary-heading" className="text-sm font-semibold text-text-primary">
            Meeting summary
          </h3>
        </div>
        <span className="text-xs text-text-tertiary">
          Call held on the platform on {call.on} · written by the listening agent
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {sections
          .filter(([, items]) => items.length > 0)
          .map(([title, items]) => (
            <div key={title} className="flex flex-col gap-1.5">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                {title}
              </h4>
              <ul className="flex flex-col gap-1 list-disc pl-4 text-sm text-text-primary leading-relaxed">
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </section>
  )
}

export type CallFormat = 'outside' | 'platform'

/** Call format: two radio cards, held outside the platform (as today) or on the platform */
export const CallFormatChoice: React.FC<{
  value: CallFormat
  onChange: (next: CallFormat) => void
  name: string
}> = ({ value, onChange, name }) => (
  <fieldset className="flex flex-col gap-2">
    <legend className="text-xs font-semibold text-text-secondary mb-1">Call format</legend>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {(
        [
          {
            id: 'outside',
            title: 'Held outside the platform',
            text: 'Use your usual meeting tool, then add what came out of the call here.',
          },
          {
            id: 'platform',
            title: 'Hold the call on the platform',
            text: 'The agent only listens and writes a structured summary at the end. It does not speak.',
          },
        ] as const
      ).map((o) => (
        <Radio
          key={o.id}
          name={name}
          checked={value === o.id}
          onChange={() => onChange(o.id)}
          label={
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-text-primary">{o.title}</span>
              <span className="text-xs text-text-secondary leading-relaxed">{o.text}</span>
            </span>
          }
          className={`px-3.5 py-3 rounded-xl border transition ${
            value === o.id
              ? 'border-[var(--app-accent)] bg-[var(--app-accent-soft)]'
              : 'border-border-default bg-bg-default hover:bg-bg-hover'
          }`}
        />
      ))}
    </div>
  </fieldset>
)

export const PlatformCallRoom: React.FC<PlatformCallRoomProps> = ({
  callType,
  caseCode,
  hostName,
  canHost,
  saved,
  onComplete,
  className = '',
}) => {
  const [phase, setPhase] = useState<'setup' | 'consent' | 'room' | 'generating'>('setup')
  const [attendees, setAttendees] = useState<CallAttendee[]>([])
  const [search, setSearch] = useState('')
  const [emailDraft, setEmailDraft] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [consented, setConsented] = useState(false)
  const [muted, setMuted] = useState(false)
  const [left, setLeft] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const link = `https://meet.m42.ae/call/${caseCode.toLowerCase()}-${callType}`
  const hostRole = callType === 'discovery' ? 'Director' : 'Sponsor'

  useEffect(() => {
    if (phase !== 'room') return
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  const term = search.trim().toLowerCase()
  const directory = useMemo(
    () =>
      M42_PEOPLE.filter(
        (p) =>
          p.name !== hostName &&
          (!term || p.name.toLowerCase().includes(term) || p.role.toLowerCase().includes(term))
      ),
    [term, hostName]
  )
  const isAdded = (key: string) =>
    attendees.some((a) => (a.email ?? a.name).toLowerCase() === key.toLowerCase())

  const toggleInternal = (p: (typeof M42_PEOPLE)[number]) =>
    setAttendees((prev) =>
      isAdded(p.email)
        ? prev.filter((a) => a.email !== p.email)
        : [...prev, { name: p.name, email: p.email, internal: true, role: p.role }]
    )

  const addEmails = (raw: string) => {
    const parts = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    for (const [i, email] of parts.entries()) {
      if (parts.findIndex((x) => x.toLowerCase() === email.toLowerCase()) !== i) {
        setEmailError('This attendee has already been added.')
        return
      }
      if (!EMAIL.test(email)) {
        setEmailError('Please enter a valid email address.')
        return
      }
      if (isAdded(email)) {
        setEmailError('This attendee has already been added.')
        return
      }
    }
    setAttendees((prev) => [
      ...prev,
      ...parts.map((email) => ({ name: email, email, internal: false })),
    ])
    setEmailDraft('')
    setEmailError(null)
  }

  if (saved) return <Summary call={saved} />

  if (!canHost) {
    return (
      <p className="text-xs text-text-tertiary">
        The {hostRole.toLowerCase()} holds this call on the platform. The summary shows here once
        the call has ended.
      </p>
    )
  }

  const everyone = [
    { name: `${hostName} (you)`, internal: true, role: hostRole } as CallAttendee,
    ...attendees,
  ]
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  return (
    <div className={`flex flex-col gap-4 ${className}`.trim()}>
      {phase === 'setup' && (
        <section
          aria-labelledby="call-setup-heading"
          className="rounded-xl border border-border-default bg-bg-default p-5 flex flex-col gap-5"
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 id="call-setup-heading" className="text-sm font-semibold text-text-primary">
              Set up the call
            </h3>
            <Badge size="sm" variant="info">
              Start now
            </Badge>
          </div>

          {left && (
            <p role="status" className="text-xs text-text-secondary">
              You left the call. Start it again when everyone is ready.
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-text-secondary">Share link</span>
            <div className="flex items-center gap-3 rounded-md border border-border-default bg-bg-surface-1 px-3 py-2">
              <span className="flex-1 min-w-0 truncate text-sm text-text-primary">{link}</span>
              <CopyButton text={link} label="call link" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="call-people-search"
                className="text-xs font-semibold text-text-secondary"
              >
                M42 attendees
              </label>
              <div className="relative">
                <Search
                  className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <Input
                  id="call-people-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or role"
                  className="pl-9"
                />
              </div>
              <ul
                aria-label="M42 people"
                className="max-h-56 overflow-y-auto rounded-md border border-border-subtle divide-y divide-border-subtle"
              >
                {directory.length === 0 ? (
                  <li className="px-3 py-2 text-xs text-text-tertiary">No one matches.</li>
                ) : (
                  directory.map((p) => (
                    <li key={p.email} className="px-3 py-2">
                      <Checkbox
                        checked={isAdded(p.email)}
                        onChange={() => toggleInternal(p)}
                        label={`${p.name} · ${p.role}`}
                      />
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="call-external-email"
                className="text-xs font-semibold text-text-secondary"
              >
                External attendees
              </label>
              <Input
                id="call-external-email"
                value={emailDraft}
                hasError={Boolean(emailError)}
                onChange={(e) => {
                  setEmailDraft(e.target.value)
                  setEmailError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    if (emailDraft.trim()) addEmails(emailDraft)
                  }
                }}
                placeholder="Type an email and press Enter or a comma"
                aria-describedby="call-external-hint"
              />
              <span
                id="call-external-hint"
                className={`text-[11px] ${emailError ? 'text-text-error' : 'text-text-tertiary'}`}
              >
                {emailError ?? 'Vendor team members and other guests. Add as many as you need.'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-text-secondary">
              {attendees.length} {attendees.length === 1 ? 'attendee' : 'attendees'}
            </span>
            {attendees.length > 0 && (
              <ul aria-label="Attendees" className="flex flex-wrap gap-1.5">
                {attendees.map((a) => (
                  <li
                    key={a.email ?? a.name}
                    className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full border border-border-default bg-bg-surface-1 text-xs text-text-primary"
                  >
                    {a.name}
                    <button
                      type="button"
                      onClick={() => setAttendees((prev) => prev.filter((x) => x !== a))}
                      aria-label={`Remove ${a.name}`}
                      className="p-0.5 rounded-full text-text-tertiary hover:text-text-primary hover:bg-bg-hover cursor-pointer"
                    >
                      <X className="w-3 h-3" strokeWidth={2} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              size="md"
              disabled={attendees.length === 0}
              onClick={() => setPhase('consent')}
              className="gap-1.5"
            >
              <Video className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
              Start now
            </Button>
          </div>
        </section>
      )}

      {phase === 'consent' && (
        <section
          aria-labelledby="call-consent-heading"
          className="rounded-xl border border-border-default bg-bg-default p-5 flex flex-col gap-4"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck
              className="w-4 h-4 text-text-secondary"
              strokeWidth={2}
              aria-hidden="true"
            />
            <h3 id="call-consent-heading" className="text-sm font-semibold text-text-primary">
              Before you join
            </h3>
          </div>
          <p className="rounded-lg border border-status-info-border bg-status-info-bg px-3 py-2 text-sm text-status-info-text">
            An AI agent will listen and transcribe this call to write a summary. It will not speak.
          </p>
          <Checkbox
            checked={consented}
            onChange={setConsented}
            label="I understand that this call is transcribed by a listening AI agent"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="md" onClick={() => setPhase('setup')}>
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={!consented}
              onClick={() => {
                setSeconds(0)
                setLeft(false)
                setPhase('room')
              }}
            >
              Join call
            </Button>
          </div>
        </section>
      )}

      {phase === 'room' && (
        <section
          aria-label={`${callType === 'discovery' ? 'Discovery' : 'Value assessment'} call room`}
          className="rounded-xl border border-border-default bg-bg-default flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border-subtle">
            <span className="text-sm font-semibold text-text-primary">
              {callType === 'discovery' ? 'Discovery call' : 'Value assessment call'} · {caseCode}
            </span>
            <Badge size="sm" variant="error">
              Live · {clock}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_16rem] min-h-0">
            <div className="flex flex-col gap-4 p-4 min-w-0">
              <ul
                aria-label="Participant tiles"
                className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-1"
              >
                <li className="rounded-lg border border-border-default bg-bg-surface-1 aspect-video flex flex-col items-center justify-center gap-1.5 p-2 text-center">
                  <span className="w-10 h-10 rounded-full bg-bg-surface-2 text-text-secondary flex items-center justify-center">
                    <Ear className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
                  </span>
                  <span className="text-xs font-medium text-text-primary">Listening agent</span>
                  <span className="text-[11px] text-text-tertiary">
                    Listening only · never speaks
                  </span>
                </li>
                {everyone.map((p, i) => (
                  <li
                    key={p.email ?? p.name}
                    className="rounded-lg border border-border-default bg-bg-surface-1 aspect-video flex flex-col items-center justify-center gap-1.5 p-2 text-center min-w-0"
                  >
                    <span className="w-10 h-10 rounded-full bg-[var(--app-accent-soft)] text-[var(--app-accent)] flex items-center justify-center text-sm font-semibold">
                      {initialsOf(p.name)}
                    </span>
                    <span className="text-xs font-medium text-text-primary truncate max-w-full">
                      {p.name}
                    </span>
                    {i === 0 && muted && (
                      <span className="text-[11px] text-text-error inline-flex items-center gap-1">
                        <MicOff className="w-3 h-3" strokeWidth={2} aria-hidden="true" />
                        Muted
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              <section
                aria-label="Live transcript"
                className="rounded-lg border border-border-subtle bg-bg-surface-1 p-3 flex flex-col gap-2"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                  Live transcript · sample
                </span>
                <ul className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                  {SAMPLE_TRANSCRIPT[callType].map((line) => (
                    <li key={line.text} className="text-xs text-text-primary leading-relaxed">
                      <span className="font-semibold">{line.who}:</span> {line.text}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <aside
              aria-labelledby="call-participants-heading"
              className="border-t lg:border-t-0 lg:border-l border-border-subtle p-4 flex flex-col gap-2 min-h-0"
            >
              <h4
                id="call-participants-heading"
                className="text-xs font-semibold text-text-primary inline-flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                Participants ({everyone.length + 1})
              </h4>
              <ul className="flex flex-col gap-1 max-h-96 overflow-y-auto pr-1">
                {[
                  ...everyone,
                  { name: 'Listening agent', internal: true, role: 'Listens only' },
                ].map((p) => (
                  <li key={p.email ?? p.name} className="flex flex-col min-w-0 py-1">
                    <span className="text-xs text-text-primary truncate">{p.name}</span>
                    <span className="text-[11px] text-text-tertiary truncate">
                      {p.role ?? (p.internal ? 'M42' : 'External')}
                    </span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>

          <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-border-subtle flex-wrap">
            <span className="text-[11px] text-text-tertiary">
              Transcription in progress. The agent does not speak.
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMuted((m) => !m)}
                aria-pressed={muted}
                className="gap-1.5"
              >
                {muted ? (
                  <MicOff className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                ) : (
                  <Mic className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                )}
                {muted ? 'Unmute' : 'Mute'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLeft(true)
                  setPhase('setup')
                }}
                className="gap-1.5"
              >
                <LogOut className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                Leave
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setPhase('generating')}
                className="gap-1.5"
              >
                <PhoneOff className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                End call
              </Button>
            </div>
          </div>
        </section>
      )}

      {phase === 'generating' && (
        <ThinkingMode
          inline
          eyebrow="GENERATING"
          title="Generating summary"
          description="The listening agent is turning the call transcript into a structured meeting summary."
          messages={SUMMARY_MESSAGES}
          stepMs={650}
          onComplete={() => onComplete(attendees)}
        />
      )}
    </div>
  )
}
