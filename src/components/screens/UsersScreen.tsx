'use client'

/**
 * UsersScreen — Screen
 * The Partnership Admin's list of platform users: one role each, the requests assigned to them and
 * their status. Search by name or email, filter by role and status, add, edit and delete users.
 * Used in: HomePage (Partnership Admin)
 */

import React, { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Inbox, Plus, SlidersHorizontal, Trash2 } from 'lucide-react'
import { Avatar } from '@/components/atoms/Avatar'
import { Badge, type BadgeProps } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { StatusChip } from '@/components/atoms/StatusChip'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { Pagination } from '@/components/molecules/Pagination'
import { RowActionsMenu } from '@/components/molecules/RowActionsMenu'
import { SearchBar } from '@/components/molecules/SearchBar'
import { Toast } from '@/components/molecules/Toast'
import { UserFormModal, type UserDraft } from '@/components/organisms/UserFormModal'
import { USER_ROLES, type PlatformUser, type UserRole } from '@/types/platformUsers'

export interface UsersScreenProps {
  users: PlatformUser[]
  onAdd: (draft: UserDraft) => void
  onEdit: (id: string, draft: UserDraft) => void
  onDelete: (id: string) => void
}

const PAGE_SIZE = 10

const ROLE_VARIANT: Record<UserRole, NonNullable<BadgeProps['variant']>> = {
  'Partnership Admin': 'success',
  Director: 'info',
  'Service Line Owner': 'warning',
  Strategy: 'default',
  'TDD Admin': 'error',
  Evaluator: 'info',
}

const SELECT =
  'w-full h-10 appearance-none pl-3 pr-9 rounded-lg border border-[#d6dee6] bg-white text-sm text-[#0d212c] hover:border-[#bcc7d3] focus:outline-none focus:border-[#a3b1c2] cursor-pointer'

const FilterSelect: React.FC<{
  id: string
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}> = ({ id, label, value, options, onChange }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-xs font-semibold text-[#475569]">
      {label}
    </label>
    <div className="relative">
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={SELECT}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
      />
    </div>
  </div>
)

/** Soft tile colours for the initials, picked from the name so a user keeps theirs */
const AVATAR_TONES = [
  '!bg-[#e0e7ff] !text-[#3730a3]',
  '!bg-[#fef3c7] !text-[#92400e]',
  '!bg-[#dcfce7] !text-[#166534]',
  '!bg-[#fce7f3] !text-[#9d174d]',
  '!bg-[#cffafe] !text-[#155e75]',
  '!bg-[#ede9fe] !text-[#5b21b6]',
]
const toneOf = (name: string) =>
  AVATAR_TONES[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % AVATAR_TONES.length]

const initialsOf = (name: string) =>
  name
    .replace(/^Dr\.\s*/, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

export const UsersScreen: React.FC<UsersScreenProps> = ({ users, onAdd, onEdit, onDelete }) => {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<PlatformUser | null>(null)
  const [deleting, setDeleting] = useState<PlatformUser | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (!filterOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setFilterOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [filterOpen])

  const term = search.trim().toLowerCase()
  const rows = useMemo(
    () =>
      users.filter(
        (u) =>
          (roleFilter === 'all' || u.role === roleFilter) &&
          (statusFilter === 'all' || u.status === statusFilter) &&
          (!term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
      ),
    [users, roleFilter, statusFilter, term]
  )
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const activeFilters = (roleFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0)

  return (
    <div className="flex flex-col gap-6 w-full text-text-primary">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-semibold text-[#0d212c]">Users</h2>
        <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
          <div className="w-full sm:w-72">
            <SearchBar
              value={search}
              onChange={(v) => {
                setSearch(v)
                setPage(1)
              }}
              placeholder="Search users by name or email..."
              showButton={false}
            />
          </div>
          <div className="relative">
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={filterOpen}
              onClick={() => setFilterOpen((o) => !o)}
              className="h-10 px-4 rounded-lg border border-[#e2e8f0] bg-white text-xs font-medium text-[#0d212c] hover:bg-[#f8fafc] flex items-center gap-2 cursor-pointer transition"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#64748b]" aria-hidden="true" />
              Filter
              {activeFilters > 0 && (
                <span className="text-[10px] font-semibold px-1.5 rounded-full bg-[#36c0c9] text-white">
                  {activeFilters}
                </span>
              )}
            </button>
            {filterOpen && (
              <div
                role="dialog"
                aria-label="Filter users"
                className="absolute right-0 top-full mt-2 z-30 w-72 bg-white rounded-2xl border border-[#e2e8f0] shadow-xl p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-1 duration-150"
              >
                <FilterSelect
                  id="users-filter-role"
                  label="Role"
                  value={roleFilter}
                  options={[
                    { value: 'all', label: 'All roles' },
                    ...USER_ROLES.map((r) => ({ value: r, label: r })),
                  ]}
                  onChange={(v) => {
                    setRoleFilter(v)
                    setPage(1)
                  }}
                />
                <FilterSelect
                  id="users-filter-status"
                  label="Status"
                  value={statusFilter}
                  options={[
                    { value: 'all', label: 'All statuses' },
                    { value: 'Active', label: 'Active' },
                    { value: 'Inactive', label: 'Inactive' },
                  ]}
                  onChange={(v) => {
                    setStatusFilter(v)
                    setPage(1)
                  }}
                />
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setRoleFilter('all')
                      setStatusFilter('all')
                      setPage(1)
                    }}
                    className="text-xs font-medium text-[#008a8a] hover:text-[#006e6e] cursor-pointer"
                  >
                    Clear all
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterOpen(false)}
                    className="h-9 px-4 rounded-lg bg-[#36c0c9] hover:bg-[#2fb0b9] text-xs font-semibold text-white cursor-pointer transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
          <Button variant="primary" size="md" onClick={() => setAdding(true)} className="gap-1.5">
            <Plus className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
            Add New User
          </Button>
        </div>
      </div>

      <div className="bg-bg-default rounded-2xl border border-border-default shadow-xs overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-surface-1 border-b border-border-default text-text-tertiary text-[11px] font-medium uppercase tracking-wider">
                <th className="py-4 px-4">Platform user</th>
                <th className="py-4 px-4">Role</th>
                <th className="py-4 px-4">Assigned requests</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Last active</th>
                <th className="py-4 px-4 w-16">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-text-tertiary">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="w-6 h-6" aria-hidden="true" />
                      <span className="text-xs">No users match your search or filters.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                visible.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          fallback={initialsOf(u.name)}
                          size="sm"
                          className={`border-transparent font-semibold ${toneOf(u.name)}`}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-[#0d212c] truncate">
                            {u.name}
                          </span>
                          <span className="text-[11px] text-[#64748b] truncate">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge size="sm" variant={ROLE_VARIANT[u.role]} className="whitespace-nowrap">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-[#0d212c] whitespace-nowrap">
                      {u.assignedRequests} {u.assignedRequests === 1 ? 'request' : 'requests'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusChip
                        label={u.status}
                        status={u.status === 'Active' ? 'success' : 'neutral'}
                        dot={false}
                      />
                    </td>
                    <td className="py-3 px-4 text-xs text-[#64748b] whitespace-nowrap">
                      {u.lastActive}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <RowActionsMenu
                        label={u.name}
                        strong
                        editLabel="Edit user"
                        deleteLabel="Delete user"
                        onEdit={() => setEditing(u)}
                        onDelete={() => setDeleting(u)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={current}
          pageSize={PAGE_SIZE}
          total={rows.length}
          onPageChange={setPage}
        />
      </div>

      {adding && (
        <UserFormModal
          takenEmails={users.map((u) => u.email)}
          onClose={() => setAdding(false)}
          onSave={(draft) => {
            onAdd(draft)
            setAdding(false)
            setToast('User added.')
          }}
        />
      )}
      {editing && (
        <UserFormModal
          initial={editing}
          takenEmails={users.filter((u) => u.id !== editing.id).map((u) => u.email)}
          onClose={() => setEditing(null)}
          onSave={(draft) => {
            onEdit(editing.id, draft)
            setEditing(null)
            setToast('User updated.')
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete this user?"
          description={`${deleting.name} will lose access to the platform. This cannot be undone.`}
          icon={Trash2}
          cancelLabel="Cancel"
          confirmLabel="Delete user"
          danger
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            onDelete(deleting.id)
            setDeleting(null)
            setToast('User deleted.')
          }}
        />
      )}
      {toast && (
        <Toast
          title={toast}
          variant="success"
          onClose={() => setToast(null)}
          className="fixed top-5 right-5 z-[60] animate-in slide-in-from-top-4 duration-200"
        />
      )}
    </div>
  )
}
