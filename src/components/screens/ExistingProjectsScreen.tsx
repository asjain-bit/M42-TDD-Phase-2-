'use client'

/**
 * ExistingProjectsScreen — Screen
 * The projects M42 already runs, with the overlap check against requests and interests. The
 * Strategy Team adds, edits and deletes projects; the Partnership Admin and Director read them.
 * Used in: HomePage (Strategy Team, Partnership Admin, Director)
 */

import React, { useState } from 'react'
import { Inbox, Plus, Radar, Trash2 } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { StatusChip } from '@/components/atoms/StatusChip'
import { SearchBar } from '@/components/molecules/SearchBar'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { RowActionsMenu } from '@/components/molecules/RowActionsMenu'
import { StatusFilterChips } from '@/components/molecules/StatusFilterChips'
import { OverlapDrawer } from '@/components/organisms/OverlapDrawer'
import { ProjectFormModal, type ProjectDraft } from '@/components/organisms/ProjectFormModal'
import { ThinkingMode } from '@/components/organisms/ThinkingMode'
import { OVERLAP_MESSAGES, OverlapFlag } from '@/components/screens/InternalInterestsScreen'
import type { ExistingProject, Overlap, ProjectStatus } from '@/types/partnership.types'

export interface ExistingProjectsScreenProps {
  projects: ExistingProject[]
  /** Results of the last overlap check, by project id */
  overlaps: Record<string, Overlap[]>
  /** Runs the overlap check over every project and stores the results */
  onRunOverlaps: () => void
  /** Strategy Team: add, edit and delete projects. Everyone else reads the table. */
  canEdit?: boolean
  /** People who can own a project */
  owners?: string[]
  /** Vendors to pick from in the project popup */
  vendorOptions?: string[]
  onAddProject?: (draft: ProjectDraft) => void
  onEditProject?: (id: string, draft: ProjectDraft) => void
  onDeleteProject?: (id: string) => void
}

const STATUSES: ProjectStatus[] = ['Live', 'Pilot', 'Completed', 'Paused']
const STATUS_TONE = {
  Live: 'success',
  Pilot: 'info',
  Completed: 'neutral',
  Paused: 'warning',
} as const

export const ExistingProjectsScreen: React.FC<ExistingProjectsScreenProps> = ({
  projects,
  overlaps,
  onRunOverlaps,
  canEdit = false,
  owners = [],
  vendorOptions = [],
  onAddProject,
  onEditProject,
  onDeleteProject,
}) => {
  // The add / edit popup (no project = adding), and the project waiting for delete confirmation
  const [form, setForm] = useState<{ project?: ExistingProject } | null>(null)
  const [deleting, setDeleting] = useState<ExistingProject | null>(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [checking, setChecking] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const open = projects.find((p) => p.id === openId) ?? null

  const chips = [
    { key: 'all', label: 'All projects', count: projects.length },
    ...STATUSES.map((s) => ({
      key: s,
      label: s,
      count: projects.filter((p) => p.status === s).length,
    })),
  ]
  const term = search.trim().toLowerCase()
  const rows = projects.filter(
    (p) =>
      (filter === 'all' || p.status === filter) &&
      (!term ||
        [p.name, p.description, p.team, p.owner, p.focusArea, ...p.vendors].some((v) =>
          v.toLowerCase().includes(term)
        ))
  )

  return (
    <div className="flex flex-col gap-6 w-full text-text-primary">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Existing Projects</h2>
          <p className="text-sm text-text-secondary">
            Projects M42 already runs. Check them for overlap with new requests and interests.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="md"
            onClick={() => setChecking(true)}
            disabled={checking}
            className="gap-1.5"
          >
            <Radar className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
            Run overlap check
          </Button>
          {canEdit && (
            <Button variant="primary" size="md" onClick={() => setForm({})} className="gap-1.5">
              <Plus className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
              Add project
            </Button>
          )}
        </div>
      </div>

      {checking && (
        <ThinkingMode
          inline
          eyebrow="ANALYZING"
          title="Checking for overlaps"
          description="The agent is comparing each project with partnership requests, other projects and internal interests."
          messages={OVERLAP_MESSAGES}
          stepMs={650}
          onComplete={() => {
            onRunOverlaps()
            setChecking(false)
          }}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <StatusFilterChips chips={chips} selected={filter} onSelect={setFilter} />
        <div className="w-full sm:w-72">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search projects..."
            showButton={false}
          />
        </div>
      </div>

      <div className="bg-bg-default rounded-2xl border border-border-default shadow-xs overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-surface-1 border-b border-border-default text-text-tertiary text-[11px] font-medium uppercase tracking-wider">
                <th className="py-4 px-4">Project</th>
                <th className="py-4 px-4">Owner</th>
                <th className="py-4 px-4">Team</th>
                <th className="py-4 px-4">Focus area</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Vendors</th>
                <th className="py-4 px-4">Overlap</th>
                {canEdit && (
                  <th className="py-4 px-4 w-12">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} className="py-16 text-center text-text-tertiary">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="w-6 h-6" aria-hidden="true" />
                      <span className="text-xs">No projects match your search or filter.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((p) => (
                  <tr key={p.id} className="hover:bg-bg-hover transition-colors">
                    <td className="py-4.5 px-4 max-w-xs">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-xs font-semibold text-text-primary">{p.name}</span>
                        <span
                          className="text-[11px] text-text-tertiary truncate"
                          title={p.description}
                        >
                          {p.description}
                        </span>
                      </div>
                    </td>
                    <td className="py-4.5 px-4 text-xs text-text-primary whitespace-nowrap">
                      {p.owner}
                    </td>
                    <td className="py-4.5 px-4 text-xs text-text-primary whitespace-nowrap">
                      {p.team}
                    </td>
                    <td className="py-4.5 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded-md bg-bg-surface-2 text-text-secondary text-xs whitespace-nowrap">
                        {p.focusArea}
                      </span>
                    </td>
                    <td className="py-4.5 px-4">
                      <StatusChip label={p.status} status={STATUS_TONE[p.status]} />
                    </td>
                    <td className="py-4.5 px-4 text-xs text-text-secondary">
                      {p.vendors.join(', ')}
                    </td>
                    <td className="py-4.5 px-4">
                      <OverlapFlag overlaps={overlaps[p.id] ?? []} onOpen={() => setOpenId(p.id)} />
                    </td>
                    {canEdit && (
                      <td className="py-4.5 px-4 text-right">
                        <RowActionsMenu
                          label={p.name}
                          onEdit={() => setForm({ project: p })}
                          onDelete={() => setDeleting(p)}
                        />
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {form && (
        <ProjectFormModal
          initial={form.project}
          owners={owners}
          vendorOptions={vendorOptions}
          onClose={() => setForm(null)}
          onSave={(draft) => {
            if (form.project) onEditProject?.(form.project.id, draft)
            else onAddProject?.(draft)
            setForm(null)
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete this project?"
          description={`${deleting.name} will be removed from Existing Projects and from the overlap checks.`}
          icon={Trash2}
          cancelLabel="Cancel"
          confirmLabel="Delete"
          danger
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            onDeleteProject?.(deleting.id)
            setDeleting(null)
          }}
        />
      )}

      {open && (
        <OverlapDrawer
          subject={open.name}
          overlaps={overlaps[open.id] ?? []}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  )
}
