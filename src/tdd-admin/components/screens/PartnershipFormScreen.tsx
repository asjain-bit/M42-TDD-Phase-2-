'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Eye,
  FileEdit,
  Inbox,
  MoreHorizontal,
  Pencil,
  Plus,
  Radio,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react'
import {
  AI_CHECKS_TODAY,
  createDraft,
  describeChanges,
  formatDate,
  type DraftSource,
  type FormVersion,
  type VersionStatus,
} from './partnershipForm.data'
import {
  FIELD_CLASS,
  Modal,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  RadioMark,
  VersionStatusChip,
} from './PartnershipFormParts'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { PartnershipFormEditor } from './PartnershipFormEditor'
import { PartnershipFormPreview } from './PartnershipFormPreview'

interface PartnershipFormScreenProps {
  versions: FormVersion[]
  onVersionsChange: (update: (prev: FormVersion[]) => FormVersion[]) => void
}

type StatusFilter = 'all' | VersionStatus

interface ToastState {
  message: string
  undo?: () => void
}

export const PartnershipFormScreen: React.FC<PartnershipFormScreenProps> = ({
  versions,
  onVersionsChange,
}) => {
  const [openId, setOpenId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [creating, setCreating] = useState(false)
  const [viewingPublic, setViewingPublic] = useState(false)
  const [discardTarget, setDiscardTarget] = useState<FormVersion | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<FormVersion | null>(null)
  const [menu, setMenu] = useState<{ id: string; top: number; left: number } | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const live = versions.find((v) => v.status === 'live')
  const draft = versions.find((v) => v.status === 'draft')
  const archived = versions.filter((v) => v.status === 'archived')
  const sorted = useMemo(() => [...versions].sort((a, b) => b.number - a.number), [versions])
  const totalRequests = versions.reduce((sum, v) => sum + v.requests, 0)

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    },
    []
  )

  useEffect(() => {
    if (!menu) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(null)
    }
    const close = () => setMenu(null)
    document.addEventListener('mousedown', handler)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', handler)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [menu])

  const showToast = (message: string, undo?: () => void) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message, undo })
    toastTimer.current = setTimeout(() => setToast(null), undo ? 7000 : 3500)
  }

  const replaceVersion = (next: FormVersion) =>
    onVersionsChange((prev) => prev.map((v) => (v.id === next.id ? next : v)))

  const startDraft = (source: DraftSource, fromVersionId: string | undefined, note: string) => {
    const created = createDraft(versions, source, fromVersionId, note)
    onVersionsChange((prev) => [created, ...prev])
    setCreating(false)
    setOpenId(created.id)
    showToast('Draft created.')
  }

  const publish = (version: FormVersion, note: string) => {
    const changes = describeChanges(live, version)
    onVersionsChange((prev) =>
      prev.map((v) => {
        if (v.id === version.id) {
          return {
            ...v,
            status: 'live',
            publishedAt: formatDate(),
            editedAt: formatDate(),
            note: note || `${changes.length} ${changes.length === 1 ? 'change' : 'changes'}`,
          }
        }
        return v.status === 'live' ? { ...v, status: 'archived' } : v
      })
    )
    setOpenId(null)
    showToast(`Version ${version.number} is now live.`)
  }

  const discard = (version: FormVersion) => {
    onVersionsChange((prev) => prev.filter((v) => v.id !== version.id))
    setDiscardTarget(null)
    setOpenId(null)
    showToast(`Draft Version ${version.number} discarded.`)
  }

  const archive = (version: FormVersion) => {
    replaceVersion({ ...version, status: 'archived', editedAt: formatDate() })
    setArchiveTarget(null)
    showToast(`Version ${version.number} archived.`)
  }

  /** An archived version comes back as the open draft */
  const unarchive = (version: FormVersion) => {
    replaceVersion({ ...version, status: 'draft', editedAt: formatDate() })
    showToast(`Version ${version.number} unarchived. It is now the open draft.`)
  }

  const filtered = sorted.filter((v) => {
    const query = search.trim().toLowerCase()
    const matchesSearch =
      !query || `version ${v.number}`.includes(query) || v.note.toLowerCase().includes(query)
    return matchesSearch && (statusFilter === 'all' || v.status === statusFilter)
  })

  const toastEl = toast && (
    <div
      role="status"
      className="fixed top-4 right-4 z-[60] bg-[#f0fdf4] text-[#15803d] pl-4 pr-3 py-3 rounded-xl shadow-md border border-[#bbf7d0] flex items-center gap-3 animate-in slide-in-from-top duration-300"
    >
      <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
      <span className="text-sm font-medium">{toast.message}</span>
      {toast.undo && (
        <button
          type="button"
          onClick={() => {
            toast.undo?.()
            setToast(null)
          }}
          className="text-sm font-bold underline cursor-pointer bg-transparent border-0 p-0 text-[#15803d]"
        >
          Undo
        </button>
      )}
    </div>
  )

  const opened = openId ? versions.find((v) => v.id === openId) : undefined
  if (opened) {
    return (
      <>
        {toastEl}
        <PartnershipFormEditor
          version={opened}
          versions={versions}
          onBack={() => setOpenId(null)}
          onChange={replaceVersion}
          onPublish={publish}
          onDiscard={discard}
          onOpenDraft={() => draft && setOpenId(draft.id)}
          onToast={showToast}
        />
      </>
    )
  }

  const chips: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All versions', count: versions.length },
    { key: 'draft', label: 'Draft', count: versions.filter((v) => v.status === 'draft').length },
    { key: 'live', label: 'Live', count: versions.filter((v) => v.status === 'live').length },
    { key: 'archived', label: 'Archived', count: archived.length },
  ]

  return (
    <div className="flex flex-col gap-6 w-full p-6 text-[#0d212c]">
      {toastEl}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          icon={<Radio className="w-5 h-5 text-[#0284c7] stroke-[2]" />}
          label="Live version"
          value={live ? `v${live.number}` : '-'}
          caption={live ? `Published ${live.publishedAt}, what vendors see` : 'No form is live'}
        />
        <StatCard
          icon={<FileEdit className="w-5 h-5 text-[#d97706] stroke-[2]" />}
          label="Draft"
          value={draft ? `v${draft.number}` : '-'}
          caption={draft ? 'In progress, private to admins' : 'No open draft'}
        />
        <StatCard
          icon={<Inbox className="w-5 h-5 text-[#6366f1] stroke-[2]" />}
          label="Requests answered"
          value={String(totalRequests)}
          caption="Across all versions"
        />
        <StatCard
          icon={<Sparkles className="w-5 h-5 text-[#ef4444] stroke-[2]" />}
          label="AI checks today"
          value={`${AI_CHECKS_TODAY.used} / ${AI_CHECKS_TODAY.limit}`}
          caption={`${AI_CHECKS_TODAY.perVendor} per vendor email a day`}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xl font-extrabold">Form versions</h2>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="Search versions"
              placeholder="Search version or note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${FIELD_CLASS} !py-2 pl-10 !text-xs shadow-xs`}
            />
          </div>
          <button
            type="button"
            onClick={() => setViewingPublic(true)}
            disabled={!live}
            className={`${SECONDARY_BUTTON} shrink-0 disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <ExternalLink className="w-4 h-4 text-[#64748b]" />
            View public form
          </button>
          <button
            type="button"
            onClick={() => {
              if (draft) {
                setOpenId(draft.id)
                showToast(`Version ${draft.number} is already a draft. Continuing it.`)
              } else {
                setCreating(true)
              }
            }}
            className={`${PRIMARY_BUTTON} shrink-0`}
          >
            <Plus className="w-4 h-4" />
            New draft
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {chips.map((chip) => {
          const selected = statusFilter === chip.key
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => setStatusFilter(chip.key)}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                selected
                  ? 'bg-[#36c0c9] text-white font-bold shadow-xs'
                  : 'bg-white text-[#64748b] border border-[#e2e8f0] hover:border-[#cbd5e1] hover:text-[#0d212c]'
              }`}
            >
              {chip.label}
              <span
                className={`px-1.5 rounded-full text-[10px] font-bold ${
                  selected ? 'bg-white/25 text-white' : 'bg-[#f1f5f9] text-[#64748b]'
                }`}
              >
                {chip.count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="rounded-xl border border-[#e2e8f0] bg-white shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[720px]">
          <thead>
            <tr className="bg-[#f8fafc] text-[11px] font-bold uppercase tracking-wide text-[#64748b]">
              {['Version', 'Status', 'Questions', 'Changes', 'Last edited', 'Requests'].map((h) => (
                <th key={h} scope="col" className="px-5 py-3 font-bold">
                  {h}
                </th>
              ))}
              <th scope="col" className="px-5 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => {
              const changeCount = v.status === 'draft' ? describeChanges(live, v).length : 0
              return (
                <tr
                  key={v.id}
                  onClick={() => setOpenId(v.id)}
                  className="hover:bg-[#f8fafc] transition cursor-pointer"
                >
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenId(v.id)
                      }}
                      className="font-bold text-sm text-[#0d212c] hover:text-[#0d7280] transition cursor-pointer bg-transparent border-0 p-0"
                    >
                      Version {v.number}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <VersionStatusChip status={v.status} />
                  </td>
                  <td className="px-5 py-4 text-[#334155]">{v.questions.length}</td>
                  <td className="px-5 py-4 text-[#334155]">
                    {v.note ||
                      (v.status === 'draft'
                        ? `${changeCount} unpublished ${changeCount === 1 ? 'change' : 'changes'}`
                        : '-')}
                  </td>
                  <td className="px-5 py-4 text-[#334155] whitespace-nowrap">
                    {v.status === 'draft' ? `Edited ${v.editedAt}` : `Published ${v.publishedAt}`}
                  </td>
                  <td className="px-5 py-4 text-[#334155]">{v.requests}</td>
                  <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      aria-label={`Actions for Version ${v.number}`}
                      aria-expanded={menu?.id === v.id}
                      onClick={(e) => {
                        if (menu?.id === v.id) return setMenu(null)
                        const box = e.currentTarget.getBoundingClientRect()
                        // Opens upward near the bottom of the window so the menu is never clipped
                        const height = 190
                        const top =
                          box.bottom + height > window.innerHeight - 8
                            ? Math.max(8, box.top - height - 4)
                            : box.bottom + 4
                        setMenu({ id: v.id, top, left: Math.max(8, box.right - 224) })
                      }}
                      className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition cursor-pointer bg-transparent border-0"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="px-6 py-12 flex flex-col items-center gap-1.5 text-center">
            <ClipboardCheck className="w-6 h-6 text-[#94a3b8]" aria-hidden="true" />
            <span className="text-sm font-bold">No versions match</span>
            <span className="text-xs text-[#64748b]">Try another search or status.</span>
          </div>
        )}
      </div>

      {menu && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: menu.top, left: menu.left }}
          className="fixed z-50 w-56 bg-white rounded-xl border border-[#e2e8f0] shadow-xl p-1.5 flex flex-col animate-in fade-in duration-100"
        >
          {(() => {
            const v = versions.find((x) => x.id === menu.id)
            if (!v) return null
            return (
              <>
                <MenuItem
                  icon={v.status === 'draft' ? Pencil : Eye}
                  label={v.status === 'draft' ? 'Edit draft' : 'View version'}
                  onClick={() => {
                    setMenu(null)
                    setOpenId(v.id)
                  }}
                />
                {v.status !== 'draft' && (
                  <MenuItem
                    icon={Plus}
                    label="Use as a new draft"
                    disabledHint={draft ? 'A draft is already open' : undefined}
                    onClick={() => {
                      setMenu(null)
                      startDraft('older', v.id, '')
                    }}
                  />
                )}
                {v.status === 'archived' ? (
                  <MenuItem
                    icon={ArchiveRestore}
                    label="Unarchive version"
                    disabledHint={draft ? 'A draft is already open' : undefined}
                    onClick={() => {
                      setMenu(null)
                      unarchive(v)
                    }}
                  />
                ) : (
                  <MenuItem
                    icon={Archive}
                    label="Archive version"
                    disabledHint={
                      v.status === 'live'
                        ? 'Publish another version before archiving this one'
                        : undefined
                    }
                    onClick={() => {
                      setMenu(null)
                      setArchiveTarget(v)
                    }}
                  />
                )}
                {v.status === 'draft' && (
                  <MenuItem
                    icon={Trash2}
                    label="Discard draft"
                    danger
                    onClick={() => {
                      setMenu(null)
                      setDiscardTarget(v)
                    }}
                  />
                )}
              </>
            )
          })()}
        </div>
      )}

      {viewingPublic && live && (
        <PartnershipFormPreview version={live} onClose={() => setViewingPublic(false)} />
      )}

      {creating && (
        <NewDraftDialog
          live={live}
          archived={archived}
          onCreate={startDraft}
          onClose={() => setCreating(false)}
        />
      )}

      {archiveTarget && (
        <ConfirmDialog
          title={`Archive Version ${archiveTarget.number}?`}
          description="It moves out of the active versions, and you can unarchive it later."
          icon={Archive}
          confirmLabel="Archive"
          onCancel={() => setArchiveTarget(null)}
          onConfirm={() => archive(archiveTarget)}
        />
      )}

      {discardTarget && (
        <ConfirmDialog
          title="Discard this draft?"
          description={`Version ${discardTarget.number} will be removed from the list. Vendors are not affected.`}
          icon={Trash2}
          danger
          confirmLabel="Discard draft"
          cancelLabel="Keep draft"
          onCancel={() => setDiscardTarget(null)}
          onConfirm={() => discard(discardTarget)}
        />
      )}
    </div>
  )
}

/** Same card as the dashboard KPI cards */
const StatCard: React.FC<{
  icon: React.ReactNode
  label: string
  value: string
  caption: string
}> = ({ icon, label, value, caption }) => (
  <div className="bg-white/90 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between gap-3">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-[0.06em]">
        {label}
      </span>
      <div className="flex items-center justify-center shrink-0">{icon}</div>
    </div>
    <div className="text-[30px] font-medium text-[#0d212c] leading-none my-1">{value}</div>
    <div className="h-[1px] bg-slate-100 w-full" />
    <div className="text-xs font-medium text-[#64748b]">{caption}</div>
  </div>
)

const MenuItem: React.FC<{
  icon: React.ElementType
  label: string
  onClick: () => void
  danger?: boolean
  disabledHint?: string
}> = ({ icon: Icon, label, onClick, danger, disabledHint }) => (
  <button
    type="button"
    role="menuitem"
    disabled={Boolean(disabledHint)}
    title={disabledHint}
    onClick={onClick}
    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-left transition cursor-pointer bg-transparent border-0 disabled:opacity-40 disabled:cursor-not-allowed ${
      danger ? 'text-red-600 hover:bg-red-50' : 'text-[#0d212c] hover:bg-[#f1f5f9]'
    }`}
  >
    <Icon className="w-4 h-4" aria-hidden="true" />
    {label}
  </button>
)

type DraftStart = 'live' | 'existing' | 'blank'

const NewDraftDialog: React.FC<{
  live?: FormVersion
  /** Archived versions to restore from */
  archived: FormVersion[]
  onCreate: (source: DraftSource, fromVersionId: string | undefined, note: string) => void
  onClose: () => void
}> = ({ live, archived, onCreate, onClose }) => {
  const [source, setSource] = useState<DraftStart>(live ? 'live' : 'blank')
  const [olderId, setOlderId] = useState(archived[0]?.id ?? '')
  const [note, setNote] = useState('')

  const options: {
    key: DraftStart
    title: string
    description: string
    badge?: string
    disabled?: boolean
  }[] = [
    {
      key: 'live',
      title: live ? `Live version (Version ${live.number})` : 'Live version',
      description: live ? `${live.questions.length} questions.` : 'No version is live yet.',
      badge: 'Recommended',
      disabled: !live,
    },
    {
      key: 'existing',
      title: 'Existing version',
      description: 'Restore the wording of an archived version.',
      disabled: archived.length === 0,
    },
    {
      key: 'blank',
      title: 'Blank form',
      description: 'Fixed company fields only, no assessment questions.',
    },
  ]

  const create = () =>
    onCreate(
      source === 'live' ? 'live' : source === 'existing' ? 'older' : 'blank',
      source === 'existing' ? olderId : undefined,
      note
    )

  return (
    <Modal
      title="New draft"
      info="A draft is private to admins. Vendors keep seeing the live version until you publish."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={SECONDARY_BUTTON}>
            Cancel
          </button>
          <button type="button" onClick={create} className={PRIMARY_BUTTON}>
            Create draft
          </button>
        </>
      }
    >
      <fieldset className="flex flex-col gap-2.5 border-0 p-0 m-0 min-w-0">
        <legend className="text-xs font-bold mb-2">Start from</legend>
        {options.map((option) => (
          <label
            key={option.key}
            className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border border-[#e2e8f0] bg-white transition ${
              option.disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer hover:border-[#cbd5e1]'
            }`}
          >
            <input
              type="radio"
              name="pf-draft-source"
              value={option.key}
              checked={source === option.key}
              disabled={option.disabled}
              onChange={() => setSource(option.key)}
              className="peer sr-only"
            />
            <RadioMark checked={source === option.key} />
            <span className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span className="flex items-center gap-2 text-sm font-bold">
                {option.title}
                {option.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-[#e6f7f8] text-[10px] font-bold text-[#0d7280]">
                    {option.badge}
                  </span>
                )}
              </span>
              <span className="text-xs text-[#64748b]">{option.description}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {source === 'existing' && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pf-draft-version" className="text-xs font-bold">
            Select version
          </label>
          <select
            id="pf-draft-version"
            value={olderId}
            onChange={(e) => setOlderId(e.target.value)}
            className={FIELD_CLASS}
          >
            {archived.map((v) => (
              <option key={v.id} value={v.id}>
                Version {v.number} ({v.questions.length} questions)
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="pf-draft-note" className="text-xs font-bold">
          Reason for the change
        </label>
        <textarea
          id="pf-draft-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Briefly describe what this version changes and why, for example a new question on data residency."
          className={`${FIELD_CLASS} resize-none leading-relaxed`}
        />
      </div>
    </Modal>
  )
}
