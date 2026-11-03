'use client'

/**
 * PlatformCallRoom — Organism
 * A discovery or value call held on the platform: set-up with any number of attendees, consent,
 * the room with a listening agent that never speaks, then the agent's structured summary.
 * Used in: DiscoveryCallStage, ValueDueDiligenceStage
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Ear,
  Mic,
  MicOff,
  PhoneOff,
  Search,
  Settings2,
  Video,
  X,
} from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Checkbox } from '@/components/atoms/Checkbox'
import { Radio } from '@/components/atoms/Radio'
import { AppDialog } from '@/components/molecules/AppDialog'
import { Input } from '@/components/atoms/Input'
import { CopyButton } from '@/components/molecules/CopyButton'
import { ThinkingMode } from '@/components/organisms/ThinkingMode'
import { buildCallQuestions } from '@/lib/callQuestions'
import { M42_PEOPLE, type CallAttendee, type PartnershipRequest } from '@/types/partnership.types'
import type { PlatformCallRoomProps } from './PlatformCallRoom.types'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Person = (typeof M42_PEOPLE)[number]

/**
 * People whose name matches the typed text: a word starting with it first ("ri" → Riza Sayeed),
 * then names that only contain it. `at` is where the match starts, for bolding.
 */
const matchPeople = (people: Person[], term: string) => {
  const starts: { person: Person; at: number }[] = []
  const contains: { person: Person; at: number }[] = []
  people.forEach((person) => {
    const name = person.name.toLowerCase()
    const at = [...name.matchAll(/[^\s-]+/g)].find((w) => name.startsWith(term, w.index))?.index
    if (at !== undefined) starts.push({ person, at })
    else if (name.includes(term)) contains.push({ person, at: name.indexOf(term) })
  })
  return [...starts, ...contains]
}

const Highlighted: React.FC<{ text: string; at: number; length: number }> = ({
  text,
  at,
  length,
}) => (
  <>
    {text.slice(0, at)}
    <strong className="font-semibold">{text.slice(at, at + length)}</strong>
    {text.slice(at + length)}
  </>
)

/** How long the summary takes to write after End call */
const SUMMARY_MS = 2000

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
    ['Key points', call.summary.keyPoints],
    ['Vendor commitments', call.summary.vendorCommitments],
    ['Open questions', call.summary.openQuestions],
    ['Risks', call.summary.risks],
    ['Next steps', call.summary.nextSteps],
    ['Questions asked', call.summary.questionsAsked ?? []],
    ['Questions not asked', call.summary.questionsNotAsked ?? []],
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
      {call.summary.attendees.length > 0 && (
        <p className="text-xs text-text-secondary">
          <span className="font-medium text-text-primary">Attendees:</span>{' '}
          {call.summary.attendees.join(', ')}
        </p>
      )}
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
  <div
    role="radiogroup"
    aria-label="Call format"
    className="inline-flex items-center rounded-lg border border-border-default bg-bg-surface-1 p-0.5"
  >
    {(
      [
        { id: 'outside', label: 'Held outside' },
        { id: 'platform', label: 'On the platform' },
      ] as const
    ).map((o) => (
      <button
        key={o.id}
        type="button"
        role="radio"
        name={name}
        aria-checked={value === o.id}
        onClick={() => onChange(o.id)}
        className={`h-7 px-3 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer transition ${
          value === o.id
            ? 'bg-bg-default text-text-primary shadow-xs border border-border-default'
            : 'text-text-secondary hover:text-text-primary border border-transparent'
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
)

/** Default invitees: the Director, the lead sponsor and the vendor contact, without the host */
export const defaultCallAttendees = (r: PartnershipRequest, hostName: string): CallAttendee[] => {
  const people: CallAttendee[] = [
    { name: 'Zaid Al Ali', email: 'zaid.alali@m42.ae', internal: true, role: 'Director' },
  ]
  const lead = r.sponsors?.lead
  if (lead) {
    const known = M42_PEOPLE.find((p) => p.name === lead)
    people.push({ name: lead, email: known?.email, internal: true, role: 'Lead sponsor' })
  }
  if (r.companyInfo?.email) {
    people.push({
      name: r.companyInfo.name || r.companyInfo.email,
      email: r.companyInfo.email,
      internal: false,
      role: `${r.companyName} · vendor contact`,
    })
  }
  return people.filter(
    (p, i) => p.name !== hostName && people.findIndex((x) => x.name === p.name) === i
  )
}

type RoomTab = 'questions' | 'transcript' | 'people'

const ROOM_TABS: { id: RoomTab; label: string }[] = [
  { id: 'questions', label: 'Questions to ask' },
  { id: 'transcript', label: 'Transcript' },
  { id: 'people', label: 'People' },
]

/** Seconds between sample transcript lines appearing */
const LINE_EVERY = 6

/** Columns and rows that fit n tiles into the stage without scrolling */
const tileGrid = (n: number) => {
  const cols = Math.ceil(Math.sqrt(n))
  return { cols, rows: Math.ceil(n / cols) }
}

type CallWhen = { mode: 'now' } | { mode: 'schedule'; date: string; start: string; end: string }

const whenText = (w: CallWhen) => {
  if (w.mode === 'now') return 'Starts now'
  const day = w.date
    ? new Date(`${w.date}T00:00:00`).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Date to be set'
  return `${day}, ${w.start || '--:--'}–${w.end || '--:--'}`
}

export const PlatformCallRoom: React.FC<PlatformCallRoomProps> = ({
  callType,
  caseCode,
  request,
  hostName,
  canHost,
  saved,
  onComplete,
  defaultAttendees = [],
  className = '',
}) => {
  const [phase, setPhase] = useState<'setup' | 'room' | 'generating'>('setup')
  const [attendees, setAttendees] = useState<CallAttendee[]>(defaultAttendees)
  const [when, setWhen] = useState<CallWhen>({ mode: 'now' })
  const [linkCopied, setLinkCopied] = useState(false)
  // Edit setup popup: a draft of the attendees and time, applied on Save
  const [editing, setEditing] = useState(false)
  const [draftAttendees, setDraftAttendees] = useState<CallAttendee[]>([])
  const [draftWhen, setDraftWhen] = useState<CallWhen>({ mode: 'now' })
  const [search, setSearch] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [consented, setConsented] = useState(false)
  const [muted, setMuted] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const link = `https://meet.m42.ae/call/${caseCode.toLowerCase()}-${callType}`
  const hostRole = callType === 'discovery' ? 'Director' : 'Sponsor'

  // In the room: questions ticked off as asked, and the right pane's tab
  const questions = useMemo(
    () => (request ? buildCallQuestions(request, callType) : []),
    [request, callType]
  )
  const [asked, setAsked] = useState<string[]>([])
  const [showAsked, setShowAsked] = useState(false)
  const [tab, setTab] = useState<RoomTab>('questions')

  useEffect(() => {
    if (phase !== 'room') return
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    // Full screen: the page behind does not scroll
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      clearInterval(t)
      document.body.style.overflow = overflow
    }
  }, [phase])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 1500)
    } catch {
      // Clipboard blocked: the link is still shown in full in Edit setup
    }
  }

  const openEdit = () => {
    setDraftAttendees(attendees)
    setDraftWhen(when)
    setSearch('')
    setEmailError(null)
    setEditing(true)
  }

  const term = search.trim().toLowerCase()
  const isAdded = (key: string) =>
    draftAttendees.some((a) => (a.email ?? a.name).toLowerCase() === key.toLowerCase())
  const suggestions = useMemo(
    () =>
      term
        ? matchPeople(
            M42_PEOPLE.filter((p) => p.name !== hostName && !isAdded(p.email)),
            term
          )
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [term, hostName, draftAttendees]
  )

  // The results dropdown floats under the field; ↑/↓ move the highlight
  const [listOpen, setListOpen] = useState(false)
  const [active, setActive] = useState(0)
  const searchRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const showList = listOpen && suggestions.length > 0

  useEffect(() => setActive(0), [term])

  useEffect(() => {
    if (!showList) return
    const onDown = (e: MouseEvent) => {
      if (!searchRef.current?.contains(e.target as Node)) setListOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [showList])

  useEffect(() => {
    if (showList) listRef.current?.children[active]?.scrollIntoView?.({ block: 'nearest' })
  }, [active, showList])

  const addPerson = (p: Person) => {
    setDraftAttendees((prev) => [
      ...prev,
      { name: p.name, email: p.email, internal: true, role: p.role },
    ])
    setSearch('')
    setEmailError(null)
    setListOpen(false)
  }

  /** Enter or comma: the highlighted person, else an email as an external guest */
  const addFromInput = () => {
    if (showList && suggestions[active]) return addPerson(suggestions[active].person)
    const value = search.trim().replace(/,$/, '')
    if (!value) return
    if (value.includes('@')) {
      if (!EMAIL.test(value)) return setEmailError('Please enter a valid email address.')
      if (isAdded(value)) return setEmailError('This attendee has already been added.')
      setDraftAttendees((prev) => [...prev, { name: value, email: value, internal: false }])
      setSearch('')
      setEmailError(null)
      return
    }
    if (suggestions[0]) addPerson(suggestions[0].person)
    else setEmailError('No one matches. Type a full email address to invite a guest.')
  }

  const scheduleInvalid =
    draftWhen.mode === 'schedule' &&
    (!draftWhen.date || !draftWhen.start || !draftWhen.end || draftWhen.end <= draftWhen.start)

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
  // The agent tile plus everyone on the call
  const grid = tileGrid(everyone.length + 1)
  // The sample transcript comes in a line at a time
  const lines = SAMPLE_TRANSCRIPT[callType].slice(0, 1 + Math.floor(seconds / LINE_EVERY))
  const open = questions.filter((q) => !asked.includes(q.id))
  const done = questions.filter((q) => asked.includes(q.id))

  return (
    <div className={`flex flex-col gap-4 ${className}`.trim()}>
      {phase === 'setup' && (
        <>
          <section
            aria-labelledby="call-setup-heading"
            className="rounded-xl border border-border-default bg-bg-default p-4 flex items-center gap-4 flex-wrap"
          >
            <h3 id="call-setup-heading" className="sr-only">
              Call set-up
            </h3>
            <div className="flex -space-x-2 shrink-0" aria-hidden="true">
              {attendees.slice(0, 4).map((a) => (
                <span
                  key={a.email ?? a.name}
                  className="w-8 h-8 rounded-full ring-2 ring-bg-default bg-[var(--app-accent-soft)] text-[var(--app-accent)] text-[11px] font-semibold flex items-center justify-center"
                >
                  {initialsOf(a.name)}
                </span>
              ))}
              {attendees.length > 4 && (
                <span className="w-8 h-8 rounded-full ring-2 ring-bg-default bg-bg-surface-2 text-text-secondary text-[11px] font-semibold flex items-center justify-center">
                  +{attendees.length - 4}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span className="text-sm font-semibold text-text-primary">
                {attendees.length} {attendees.length === 1 ? 'attendee' : 'attendees'}
              </span>
              <span className="flex items-center gap-2 flex-wrap text-xs text-text-tertiary min-w-0">
                <span className="truncate">
                  {whenText(when)} · {link}
                </span>
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center gap-1 font-medium text-text-link hover:underline cursor-pointer shrink-0"
                >
                  {linkCopied ? (
                    <Check className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                  )}
                  {linkCopied ? 'Copied' : 'Copy link'}
                </button>
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={openEdit} className="gap-1.5 shrink-0">
              <Settings2 className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
              Edit setup
            </Button>
          </section>

          {/* Consent and start, always in view */}
          <div className="sticky bottom-0 z-10 -mx-1 px-4 py-3 rounded-xl border border-border-default bg-bg-default shadow-md flex items-center justify-between gap-4 flex-wrap">
            <Checkbox
              checked={consented}
              onChange={setConsented}
              label="Attendees are told an AI agent will listen and transcribe this call."
            />
            <Button
              variant="primary"
              size="md"
              disabled={!consented || attendees.length === 0}
              onClick={() => {
                setSeconds(0)
                setAsked([])
                setTab('questions')
                setPhase('room')
              }}
              className="gap-1.5"
            >
              <Video className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
              Start call
            </Button>
          </div>

          <AppDialog
            isOpen={editing}
            title="Edit setup"
            description="Who joins, when, and the link to share."
            onClose={() => setEditing(false)}
            actions={
              <>
                <Button variant="outline" size="md" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  disabled={scheduleInvalid || draftAttendees.length === 0}
                  onClick={() => {
                    setAttendees(draftAttendees)
                    setWhen(draftWhen)
                    setEditing(false)
                  }}
                >
                  Save
                </Button>
              </>
            }
          >
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="call-attendee-input"
                  className="text-xs font-semibold text-text-secondary"
                >
                  Attendees
                </label>
                <div ref={searchRef} className="relative">
                  <Search
                    className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <Input
                    id="call-attendee-input"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={showList}
                    aria-controls="call-attendee-results"
                    aria-activedescendant={
                      showList ? `call-attendee-option-${active}` : undefined
                    }
                    autoComplete="off"
                    value={search}
                    hasError={Boolean(emailError)}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setEmailError(null)
                      setListOpen(true)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                        e.preventDefault()
                        if (!showList) return setListOpen(true)
                        const step = e.key === 'ArrowDown' ? 1 : -1
                        setActive((i) => (i + step + suggestions.length) % suggestions.length)
                      } else if (e.key === 'Escape' && showList) {
                        // Closes the dropdown only, not the popup
                        e.preventDefault()
                        e.stopPropagation()
                        setListOpen(false)
                      } else if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault()
                        addFromInput()
                      }
                    }}
                    placeholder="Search M42 people or type an email and press Enter"
                    aria-describedby="call-attendee-hint"
                    className="pl-9"
                  />
                  {showList && (
                    <ul
                      ref={listRef}
                      id="call-attendee-results"
                      role="listbox"
                      aria-label="Matching people"
                      className="absolute left-0 right-0 top-full mt-1 z-20 max-h-[240px] overflow-y-auto overscroll-contain rounded-md border border-border-default bg-bg-modal shadow-lg py-1"
                    >
                      {suggestions.map(({ person, at }, i) => (
                        <li
                          key={person.email}
                          id={`call-attendee-option-${i}`}
                          role="option"
                          aria-selected={i === active}
                          // mousedown keeps focus in the field, so typing can carry on
                          onMouseDown={(e) => {
                            e.preventDefault()
                            addPerson(person)
                          }}
                          onMouseEnter={() => setActive(i)}
                          className={`px-3 py-2 flex flex-col cursor-pointer ${
                            i === active ? 'bg-bg-hover' : ''
                          }`}
                        >
                          <span className="text-sm text-text-primary">
                            <Highlighted text={person.name} at={at} length={term.length} />
                          </span>
                          <span className="text-[11px] text-text-tertiary">{person.role}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <span
                  id="call-attendee-hint"
                  className={`text-[11px] ${emailError ? 'text-text-error' : 'text-text-tertiary'}`}
                >
                  {emailError ??
                    `${draftAttendees.length} ${draftAttendees.length === 1 ? 'attendee' : 'attendees'}. Add as many as you need.`}
                </span>
                {draftAttendees.length > 0 && (
                  <ul aria-label="Attendees" className="flex flex-wrap gap-1.5">
                    {draftAttendees.map((a) => (
                      <li
                        key={a.email ?? a.name}
                        className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full border border-border-default bg-bg-surface-1 text-xs text-text-primary"
                      >
                        {a.name}
                        <button
                          type="button"
                          onClick={() => setDraftAttendees((prev) => prev.filter((x) => x !== a))}
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

              <fieldset className="flex flex-col gap-2">
                <legend className="text-xs font-semibold text-text-secondary mb-1">When</legend>
                <div className="flex items-center gap-4">
                  <Radio
                    name="call-when"
                    checked={draftWhen.mode === 'now'}
                    onChange={() => setDraftWhen({ mode: 'now' })}
                    label="Start now"
                  />
                  <Radio
                    name="call-when"
                    checked={draftWhen.mode === 'schedule'}
                    onChange={() =>
                      setDraftWhen(
                        draftWhen.mode === 'schedule'
                          ? draftWhen
                          : { mode: 'schedule', date: '', start: '10:00', end: '11:00' }
                      )
                    }
                    label="Schedule"
                  />
                </div>
                {draftWhen.mode === 'schedule' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(
                      [
                        { key: 'date', label: 'Date', type: 'date' },
                        { key: 'start', label: 'Start', type: 'time' },
                        { key: 'end', label: 'End', type: 'time' },
                      ] as const
                    ).map((f) => (
                      <div key={f.key} className="flex flex-col gap-1">
                        <label htmlFor={`call-${f.key}`} className="text-[11px] text-text-tertiary">
                          {f.label}
                        </label>
                        <Input
                          id={`call-${f.key}`}
                          type={f.type}
                          value={draftWhen[f.key]}
                          onChange={(e) => setDraftWhen({ ...draftWhen, [f.key]: e.target.value })}
                        />
                      </div>
                    ))}
                    {scheduleInvalid && draftWhen.date && (
                      <span className="sm:col-span-3 text-[11px] text-text-error">
                        The end time must be after the start time.
                      </span>
                    )}
                  </div>
                )}
              </fieldset>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-text-secondary">Call link</span>
                <div className="flex items-center gap-3 rounded-md border border-border-default bg-bg-surface-1 px-3 py-2">
                  <span className="flex-1 min-w-0 truncate text-sm text-text-primary">{link}</span>
                  <CopyButton text={link} label="call link" />
                </div>
              </div>
            </div>
          </AppDialog>
        </>
      )}

      {/* Full screen while live: closes only through End call */}
      {phase === 'room' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="call-room-title"
            className="fixed inset-0 z-[70] w-screen h-screen flex flex-col bg-bg-default text-text-primary overflow-hidden"
          >
            {/* Top bar */}
            <header className="flex items-center justify-between gap-4 px-6 h-14 border-b border-border-subtle bg-bg-surface-1 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <h2 id="call-room-title" className="text-sm font-semibold truncate">
                  {callType === 'discovery' ? 'Discovery' : 'Value'} call ·{' '}
                  {request?.companyName ?? 'Vendor'} · {caseCode}
                </h2>
                <Badge size="sm" variant="error" className="gap-1.5 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  Live {clock}
                </Badge>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary shrink-0">
                <Ear className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                Listening agent is transcribing
              </span>
            </header>

            <div className="flex flex-1 min-h-0">
              {/* Stage: tiles and controls */}
              <div className="flex-1 min-w-0 flex flex-col gap-3 p-4">
                <ul
                  aria-label="Participant tiles"
                  className="flex-1 min-h-0 grid gap-3"
                  style={{
                    gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${grid.rows}, minmax(0, 1fr))`,
                  }}
                >
                  <li className="min-h-0 rounded-xl border border-border-default bg-bg-surface-1 flex flex-col items-center justify-center gap-1.5 p-2 text-center overflow-hidden">
                    <span className="w-12 h-12 rounded-full bg-bg-surface-2 text-text-secondary flex items-center justify-center shrink-0">
                      <Ear className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span className="text-sm font-medium">Listening agent</span>
                    <span className="text-[11px] text-text-tertiary">Listens only · never speaks</span>
                  </li>
                  {everyone.map((p, i) => (
                    <li
                      key={p.email ?? p.name}
                      className="min-h-0 min-w-0 rounded-xl border border-border-default bg-bg-surface-1 flex flex-col items-center justify-center gap-1.5 p-2 text-center overflow-hidden"
                    >
                      <span className="w-12 h-12 rounded-full bg-[var(--app-accent-soft)] text-[var(--app-accent)] flex items-center justify-center text-sm font-semibold shrink-0">
                        {initialsOf(p.name)}
                      </span>
                      <span className="text-sm font-medium truncate max-w-full">{p.name}</span>
                      {p.role && (
                        <span className="text-[11px] text-text-tertiary truncate max-w-full">
                          {p.role}
                        </span>
                      )}
                      {i === 0 && muted && (
                        <span className="text-[11px] text-text-error inline-flex items-center gap-1">
                          <MicOff className="w-3 h-3" strokeWidth={2} aria-hidden="true" />
                          Muted
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-center gap-3 shrink-0">
                  <Button
                    variant="outline"
                    size="md"
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
                    variant="destructive"
                    size="md"
                    onClick={() => setPhase('generating')}
                    className="gap-1.5"
                  >
                    <PhoneOff className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                    End call
                  </Button>
                </div>
              </div>

              {/* Host pane: only this scrolls */}
              <aside
                aria-label="Call notes"
                className="w-[360px] shrink-0 border-l border-border-subtle flex flex-col min-h-0"
              >
                <div
                  role="tablist"
                  aria-label="Call notes"
                  className="flex items-center gap-1 px-3 border-b border-border-subtle shrink-0"
                >
                  {ROOM_TABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      id={`call-tab-${t.id}`}
                      aria-selected={tab === t.id}
                      aria-controls="call-tab-panel"
                      onClick={() => setTab(t.id)}
                      className={`h-11 px-2.5 text-xs font-medium border-b-2 -mb-px cursor-pointer transition ${
                        tab === t.id
                          ? 'border-[var(--app-accent)] text-text-primary'
                          : 'border-transparent text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {t.label}
                      {t.id === 'questions' && open.length > 0 && ` (${open.length})`}
                    </button>
                  ))}
                </div>

                <div
                  id="call-tab-panel"
                  role="tabpanel"
                  aria-labelledby={`call-tab-${tab}`}
                  className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4"
                >
                  {tab === 'questions' && (
                    <div className="flex flex-col gap-4">
                      {questions.length === 0 ? (
                        <p className="text-xs text-text-tertiary">
                          No suggested questions for this case.
                        </p>
                      ) : open.length === 0 ? (
                        <p className="text-xs text-text-tertiary">
                          Every suggested question has been asked.
                        </p>
                      ) : (
                        <ul className="flex flex-col gap-3">
                          {open.map((q) => (
                            <li
                              key={q.id}
                              className="flex flex-col gap-1 rounded-lg border border-border-subtle p-3"
                            >
                              <Checkbox
                                checked={false}
                                onChange={() => setAsked((prev) => [...prev, q.id])}
                                label={q.text}
                              />
                              <span className="pl-6 text-[11px] text-text-tertiary">{q.reason}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {done.length > 0 && (
                        <div className="flex flex-col gap-2 border-t border-border-subtle pt-3">
                          <button
                            type="button"
                            onClick={() => setShowAsked((v) => !v)}
                            aria-expanded={showAsked}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer self-start"
                          >
                            {showAsked ? (
                              <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                            )}
                            Asked · {done.length}
                          </button>
                          {showAsked && (
                            <ul className="flex flex-col gap-2">
                              {done.map((q) => (
                                <li key={q.id} className="text-text-tertiary">
                                  <Checkbox
                                    checked
                                    onChange={() =>
                                      setAsked((prev) => prev.filter((id) => id !== q.id))
                                    }
                                    label={q.text}
                                  />
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {tab === 'transcript' && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                        Live transcript · sample
                      </span>
                      <ul className="flex flex-col gap-2">
                        {lines.map((line) => (
                          <li key={line.text} className="text-xs leading-relaxed">
                            <span className="font-semibold">{line.who}:</span> {line.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {tab === 'people' && (
                    <ul className="flex flex-col gap-1">
                      {[...everyone, { name: 'Listening agent', internal: true, role: 'Listens only' }].map(
                        (p) => (
                          <li
                            key={p.email ?? p.name}
                            className="flex items-center justify-between gap-3 py-1.5 min-w-0"
                          >
                            <span className="flex flex-col min-w-0">
                              <span className="text-xs truncate">{p.name}</span>
                              {p.role && (
                                <span className="text-[11px] text-text-tertiary truncate">
                                  {p.role}
                                </span>
                              )}
                            </span>
                            <Badge size="sm" variant={p.internal ? 'default' : 'info'}>
                              {p.internal ? 'M42' : 'External'}
                            </Badge>
                          </li>
                        )
                      )}
                    </ul>
                  )}
                </div>
              </aside>
            </div>
          </div>,
          document.body
        )}

      {phase === 'generating' && (
        <ThinkingMode
          inline
          eyebrow="SUMMARISING"
          title="Writing the meeting summary…"
          description="The listening agent is turning the call transcript into a structured meeting summary."
          messages={SUMMARY_MESSAGES}
          stepMs={SUMMARY_MS / SUMMARY_MESSAGES.length}
          onComplete={() =>
            onComplete(attendees, {
              asked: done.map((q) => q.text),
              notAsked: open.map((q) => q.text),
            })
          }
        />
      )}
    </div>
  )
}
