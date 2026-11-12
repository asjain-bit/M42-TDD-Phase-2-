/** The roles a platform user can hold; each user has exactly one */
export const USER_ROLES = [
  'Partnership Admin',
  'Director',
  'Service Line Owner',
  'Strategy',
  'TDD Admin',
  'Evaluator',
] as const

export type UserRole = (typeof USER_ROLES)[number]
export type UserStatus = 'Active' | 'Inactive'

export interface PlatformUser {
  id: string
  name: string
  email: string
  role: UserRole
  /** Number of partnership requests assigned to the user */
  assignedRequests: number
  status: UserStatus
  lastActive: string
  /** Service Line Owners only */
  department?: string
  /** The KPIs mapped to this owner */
  kpis?: string[]
  domainExpertise?: string
}

export const INITIAL_PLATFORM_USERS: PlatformUser[] = [
  {
    id: 'usr-01',
    name: 'Nadia Al-Farsi',
    email: 'nadia.alfarsi@m42.ae',
    role: 'Partnership Admin',
    assignedRequests: 12,
    status: 'Active',
    lastActive: 'Just now',
  },
  {
    id: 'usr-02',
    name: 'Zaid Al Ali',
    email: 'zaid.alali@m42.ae',
    role: 'Director',
    assignedRequests: 8,
    status: 'Active',
    lastActive: '25 mins ago',
  },
  {
    id: 'usr-03',
    name: 'Tariq Mansoor',
    email: 'tmansoor@m42.ae',
    role: 'Strategy',
    assignedRequests: 6,
    status: 'Active',
    lastActive: '1 hour ago',
  },
  {
    id: 'usr-04',
    name: 'Rashid Al-Nuaimi',
    email: 'rashid.alnuaimi@m42.ae',
    role: 'Service Line Owner',
    assignedRequests: 4,
    status: 'Active',
    lastActive: '3 hours ago',
  },
  {
    id: 'usr-05',
    name: 'Dr. Fatima Al Nuaimi',
    email: 'dr.fatima@m42.ae',
    role: 'TDD Admin',
    assignedRequests: 9,
    status: 'Active',
    lastActive: 'Yesterday',
  },
  {
    id: 'usr-06',
    name: 'Mariam Al-Zaabi',
    email: 'mariam.alzaabi@m42.ae',
    role: 'Evaluator',
    assignedRequests: 5,
    status: 'Active',
    lastActive: '2 days ago',
  },
  {
    id: 'usr-07',
    name: 'Sarah Jenkins',
    email: 'sjenkins@m42.ae',
    role: 'Evaluator',
    assignedRequests: 3,
    status: 'Active',
    lastActive: '3 days ago',
  },
  {
    id: 'usr-08',
    name: 'Marcus Vance',
    email: 'mvance@m42.ae',
    role: 'Strategy',
    assignedRequests: 4,
    status: 'Inactive',
    lastActive: '2 weeks ago',
  },
  {
    id: 'usr-09',
    name: 'Ishita Sharma',
    email: 'isharma@m42.ae',
    role: 'Service Line Owner',
    assignedRequests: 7,
    status: 'Active',
    lastActive: '2 hours ago',
  },
  {
    id: 'usr-10',
    name: 'Amina Al Zaabi',
    email: 'azaabi@m42.ae',
    role: 'Director',
    assignedRequests: 9,
    status: 'Active',
    lastActive: '4 hours ago',
  },
  {
    id: 'usr-11',
    name: 'Omar Al-Hashemi',
    email: 'oalhashemi@m42.ae',
    role: 'Strategy',
    assignedRequests: 2,
    status: 'Active',
    lastActive: 'Yesterday',
  },
  {
    id: 'usr-12',
    name: 'Hessa Al Marzooqi',
    email: 'hmarzooqi@m42.ae',
    role: 'Evaluator',
    assignedRequests: 3,
    status: 'Inactive',
    lastActive: '1 month ago',
  },
  {
    id: 'usr-13',
    name: 'David Chen',
    email: 'dchen@m42.ae',
    role: 'TDD Admin',
    assignedRequests: 5,
    status: 'Active',
    lastActive: '3 days ago',
  },
  {
    id: 'usr-14',
    name: 'Parag Agarwal',
    email: 'pagarwal@m42.ae',
    role: 'Service Line Owner',
    assignedRequests: 6,
    status: 'Active',
    lastActive: 'Yesterday',
  },
]

/** The KPIs a Service Line Owner can be mapped to */
export const SERVICE_LINE_KPIS: string[] = [
  'Cost Reduction',
  'Operational Efficiency',
  'Revenue Growth',
  'Patient Experience & Satisfaction',
  'Workforce Productivity',
  'Quality of Care & Clinical Outcomes',
]
