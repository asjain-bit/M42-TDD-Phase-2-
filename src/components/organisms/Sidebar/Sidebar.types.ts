import type { LucideIcon } from 'lucide-react'

export interface SidebarNavItem {
  id: string
  label: string
  icon: LucideIcon
}

export interface SidebarProps {
  /** Navigation items; defaults to Dashboard and Usage */
  items?: SidebarNavItem[]
  /** Active navigation tab identifier */
  activeTab: string
  /** Tab selection callback */
  onTabChange: (tabId: string) => void
  /** Whether sidebar is collapsed into icon-only mode */
  collapsed: boolean
  /** Toggle collapse handler */
  onToggleCollapse: () => void
  /** Logged in user display name */
  userName?: string
  /** User corporate email address */
  userEmail?: string
  /** User organizational designation (e.g. Director) */
  userDesignation?: string
  /** User profile image URL */
  userAvatarUrl?: string
  /** Sign out callback */
  onSignOut?: () => void
}
