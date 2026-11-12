'use client'

import React, { useState, useMemo } from 'react'
import {
  MoreVertical,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  PhoneCall,
  CheckCircle2,
  X,
  Info,
  Loader2,
  Check,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react'

import { StatusChip } from '@/tdd-admin/components/atoms/StatusChip'
import { CountryFlag } from '@/tdd-admin/components/atoms/CountryFlag'
import { FilterMenu } from '@/tdd-admin/components/molecules/FilterMenu'
import { ConfigureVendorCallScreen, VendorDispatchData } from './ConfigureVendorCallScreen'

interface VendorRow {
  id: string
  caseId: string
  vendorId: string
  name: string
  legalName: string
  email: string
  domain: string
  country: string
  flag: string
  status: string
  score: string
  website?: string
  recipients?: string[]
}

// Case IDs follow the PR-### format; new vendors take the next number after the highest one
const getNextCaseId = (rows: VendorRow[]) =>
  `PR-${Math.max(0, ...rows.map((row) => Number(row.caseId.replace('PR-', '')) || 0)) + 1}`

// Round labels already used by earlier assessments of each case
const USED_ROUND_LABELS: Record<string, string[]> = {
  'PR-126': ['Round 1'],
  'PR-125': ['Round 2', 'Round 1'],
  'PR-124': ['Initial Review'],
  'PR-123': ['Stage 2 Audit'],
  'PR-122': ['Round 1 - Technical'],
  'PR-121': ['Follow-up Audit', 'Round 1'],
  'PR-120': ['Round 3', 'Round 2', 'Round 1'],
  'PR-119': ['Annual Re-evaluation'],
  'PR-118': ['Stage 1 Discovery'],
  'PR-117': ['Pre-onboarding'],
  'PR-116': ['Round 2 - Compliance', 'Round 1 - Compliance'],
  'PR-115': ['Final Review'],
}

// Vendor IDs follow the VND-#### format, numbered the same way
const getNextVendorId = (rows: VendorRow[]) =>
  `VND-${Math.max(0, ...rows.map((row) => Number(row.vendorId.replace('VND-', '')) || 0)) + 1}`

interface SearchVendorResult {
  id: string
  name: string
  domain: string
  country?: string
  confidence: 'High confidence' | 'Medium confidence' | 'Low confidence'
  confidenceType: 'success' | 'warning' | 'error'
}

export const VendorsScreen: React.FC = () => {
  const [activeDispatchVendor, setActiveDispatchVendor] = useState<VendorRow | null>(null)
  const [dispatchSuccessToast, setDispatchSuccessToast] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [vendorFilters, setVendorFilters] = useState<Record<string, string>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 8

  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null)

  // Onboarding Modal state: Default mode is 'find'
  const [showAddVendorModal, setShowAddVendorModal] = useState(false)
  const [onboardingMode, setOnboardingMode] = useState<'find' | 'manual'>('find')

  // Find vendor search & spinner state
  const [findSearchQuery, setFindSearchQuery] = useState('')
  const [isSearchingVendor, setIsSearchingVendor] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedSearchResult, setSelectedSearchResult] = useState<SearchVendorResult | null>(null)

  // Find vendor manual fields (NO auto-population)
  const [findCountry, setFindCountry] = useState('')
  const [findWebsite, setFindWebsite] = useState('')
  const [isFindCountryOpen, setIsFindCountryOpen] = useState(false)

  // Find vendor recipients tag-input state
  const [findRecipientInput, setFindRecipientInput] = useState('')
  const [findRecipients, setFindRecipients] = useState<string[]>([])
  const [findRecipientError, setFindRecipientError] = useState<string | null>(null)

  // Manual vendor tab inputs
  const [manualDisplayName, setManualDisplayName] = useState('')
  const [manualLegalName, setManualLegalName] = useState('')
  const [manualCountry, setManualCountry] = useState('')
  const [manualWebsite, setManualWebsite] = useState('')
  const [isManualCountryOpen, setIsManualCountryOpen] = useState(false)

  // Manual vendor recipients tag-input state
  const [manualRecipientInput, setManualRecipientInput] = useState('')
  const [manualRecipients, setManualRecipients] = useState<string[]>([])
  const [manualRecipientError, setManualRecipientError] = useState<string | null>(null)

  // Edit Vendor modal state
  const [editingVendor, setEditingVendor] = useState<VendorRow | null>(null)
  const [isEditCountryOpen, setIsEditCountryOpen] = useState(false)
  const [confirmStatusVendor, setConfirmStatusVendor] = useState<{
    vendor: VendorRow
    targetStatus: 'Activated' | 'Deactivated'
  } | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Edit vendor recipients tag input state
  const [editRecipientInput, setEditRecipientInput] = useState('')
  const [editRecipientError, setEditRecipientError] = useState<string | null>(null)

  // Recipients column expand/collapse toggle state
  const [expandedRecipients, setExpandedRecipients] = useState<Record<string, boolean>>({})

  const worldCountryOptions = [
    { name: 'France', flag: '🇫🇷' },
    { name: 'Germany', flag: '🇩🇪' },
    { name: 'Netherlands', flag: '🇳🇱' },
    { name: 'Saudi Arabia', flag: '🇸🇦' },
    { name: 'Singapore', flag: '🇸🇬' },
    { name: 'United Arab Emirates', flag: '🇦🇪' },
    { name: 'United Kingdom', flag: '🇬🇧' },
    { name: 'United States', flag: '🇺🇸' },
  ]

  // Mock search results list
  const searchVendorResults: SearchVendorResult[] = [
    {
      id: 'sr-1',
      name: 'Presight AI Holding PLC',
      domain: 'presight.ai',
      country: 'United Arab Emirates',
      confidence: 'High confidence',
      confidenceType: 'success',
    },
    {
      id: 'sr-2',
      name: 'Directus Open Source Ltd',
      domain: 'directus.io',
      country: 'United States',
      confidence: 'High confidence',
      confidenceType: 'success',
    },
    {
      id: 'sr-3',
      name: 'Pango Cybersecurity Global',
      domain: 'pango.com',
      country: 'United States',
      confidence: 'Medium confidence',
      confidenceType: 'warning',
    },
    {
      id: 'sr-4',
      name: 'Apex Healthcare Advisory',
      domain: 'apexhealth.co',
      country: 'United Kingdom',
      confidence: 'Medium confidence',
      confidenceType: 'warning',
    },
    {
      id: 'sr-5',
      name: 'Delphi Intelligence Systems',
      domain: 'delphiai.de',
      country: 'Germany',
      confidence: 'Low confidence',
      confidenceType: 'warning',
    },
  ]

  const [statusFilter, setStatusFilter] = useState<'all' | 'Activated' | 'Deactivated'>('all')
  const [isAddingVendor, setIsAddingVendor] = useState(false)
  const [addingVendorName, setAddingVendorName] = useState('')

  const [vendors, setVendors] = useState<VendorRow[]>([
    {
      id: 'v-1',
      caseId: 'PR-126',
      vendorId: 'VND-1026',
      name: 'Presight AI | See the Future Today',
      legalName: 'Presight AI Holding PLC',
      email: 'compliance@presight.ai',
      domain: 'presight.ai',
      country: 'United Arab Emirates',
      flag: '🇦🇪',
      status: 'Activated',
      score: '94.0',
      recipients: [
        'compliance@presight.ai',
        'security@presight.ai',
        'audit@presight.ai',
        'legal@presight.ai',
        'dpo@presight.ai',
      ],
    },
    {
      id: 'v-2',
      caseId: 'PR-125',
      vendorId: 'VND-1025',
      name: 'Directus Inc.',
      legalName: 'Directus Open Source Ltd',
      email: 'security@directus.io',
      domain: 'directus.io',
      country: 'United States',
      flag: '🇺🇸',
      status: 'Activated',
      score: '88.5',
      recipients: ['security@directus.io', 'admin@directus.io'],
    },
    {
      id: 'v-3',
      caseId: 'PR-124',
      vendorId: 'VND-1024',
      name: 'Pango Group LLC',
      legalName: 'Pango Cybersecurity Global',
      email: 'legal@pango.com',
      domain: 'pango.com',
      country: 'United States',
      flag: '🇺🇸',
      status: 'Activated',
      score: '91.2',
      recipients: [],
    },
    {
      id: 'v-4',
      caseId: 'PR-123',
      vendorId: 'VND-1023',
      name: 'Apex Systems Advisory',
      legalName: 'Apex Healthcare Solutions Inc.',
      email: 'contact@apexsystems.com',
      domain: 'apexsystems.com',
      country: 'United Kingdom',
      flag: '🇬🇧',
      status: 'Activated',
      score: '76.0',
      recipients: [
        'contact@apexsystems.com',
        'legal@apexsystems.com',
        'info@apexsystems.com',
        'privacy@apexsystems.com',
        'compliance@apexsystems.com',
      ],
    },
    {
      id: 'v-5',
      caseId: 'PR-122',
      vendorId: 'VND-1022',
      name: 'Delphi AI Technologies',
      legalName: 'Delphi Intelligence Systems',
      email: 'audit@delphiai.com',
      domain: 'delphiai.com',
      country: 'Germany',
      flag: '🇩🇪',
      status: 'Activated',
      score: '95.8',
      recipients: ['audit@delphiai.com', 'tech@delphiai.com'],
    },
    {
      id: 'v-6',
      caseId: 'PR-121',
      vendorId: 'VND-1021',
      name: 'BioHealth Analytics',
      legalName: 'BioHealth Data Group GMBH',
      email: 'info@biohealth.de',
      domain: 'biohealth.de',
      country: 'Germany',
      flag: '🇩🇪',
      status: 'Deactivated',
      score: '64.0',
      recipients: [],
    },
    {
      id: 'v-7',
      caseId: 'PR-120',
      vendorId: 'VND-1020',
      name: 'CloudScale AI Systems',
      legalName: 'CloudScale Technologies B.V.',
      email: 'ops@cloudscale.nl',
      domain: 'cloudscale.nl',
      country: 'Netherlands',
      flag: '🇳🇱',
      status: 'Activated',
      score: '92.0',
      recipients: ['ops@cloudscale.nl', 'sec@cloudscale.nl'],
    },
    {
      id: 'v-[#8]',
      caseId: 'PR-119',
      vendorId: 'VND-1019',
      name: 'CyberGuard Solutions',
      legalName: 'CyberGuard Security Systems SAS',
      email: 'trust@cyberguard.fr',
      domain: 'cyberguard.fr',
      country: 'France',
      flag: '🇫🇷',
      status: 'Activated',
      score: '90.4',
      recipients: ['trust@cyberguard.fr', 'privacy@cyberguard.fr'],
    },
    {
      id: 'v-9',
      caseId: 'PR-118',
      vendorId: 'VND-1018',
      name: 'HealthCloud Telemetry',
      legalName: 'HealthCloud Global Pte. Ltd.',
      email: 'support@healthcloud.sg',
      domain: 'healthcloud.sg',
      country: 'Singapore',
      flag: '🇸🇬',
      status: 'Activated',
      score: '87.1',
      recipients: ['support@healthcloud.sg', 'compliance@healthcloud.sg'],
    },
    {
      id: 'v-10',
      caseId: 'PR-117',
      vendorId: 'VND-1017',
      name: 'PharmaTech Analytics',
      legalName: 'PharmaTech Clinical Systems KSA',
      email: 'regulatory@pharmatech.sa',
      domain: 'pharmatech.sa',
      country: 'Saudi Arabia',
      flag: '🇸🇦',
      status: 'Activated',
      score: '82.3',
      recipients: ['regulatory@pharmatech.sa', 'info@pharmatech.sa'],
    },
    {
      id: 'v-11',
      caseId: 'PR-116',
      vendorId: 'VND-1016',
      name: 'MedSec Audit Co',
      legalName: 'MedSec Compliance Services UAE',
      email: 'audits@medsec.ae',
      domain: 'medsec.ae',
      country: 'United Arab Emirates',
      flag: '🇦🇪',
      status: 'Deactivated',
      score: '69.5',
      recipients: ['audits@medsec.ae', 'contact@medsec.ae'],
    },
    {
      id: 'v-12',
      caseId: 'PR-115',
      vendorId: 'VND-1015',
      name: 'Global Diagnostics IT',
      legalName: 'Global Diagnostics Technology Corp',
      email: 'info@globaldiag.com',
      domain: 'globaldiag.com',
      country: 'United States',
      flag: '🇺🇸',
      status: 'Activated',
      score: '93.7',
      recipients: ['info@globaldiag.com', 'sec@globaldiag.com'],
    },
  ])

  // Filtered suppliers
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchesStatus = statusFilter === 'all' || v.status === statusFilter
      const query = searchTerm.toLowerCase()
      const matchesSearch =
        v.caseId.toLowerCase().includes(query) ||
        v.vendorId.toLowerCase().includes(query) ||
        v.name.toLowerCase().includes(query) ||
        v.legalName.toLowerCase().includes(query) ||
        v.email.toLowerCase().includes(query) ||
        (v.recipients && v.recipients.some((r) => r.toLowerCase().includes(query))) ||
        v.domain.toLowerCase().includes(query) ||
        v.country.toLowerCase().includes(query)
      const matchesFilters =
        (!vendorFilters.vendor || v.name === vendorFilters.vendor) &&
        (!vendorFilters.country || v.country === vendorFilters.country)
      return matchesStatus && matchesSearch && matchesFilters
    })
  }, [vendors, searchTerm, statusFilter, vendorFilters])

  // Filter options are built from the vendors currently in the directory
  const vendorFilterFields = useMemo(() => {
    const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b))
    return [
      { key: 'vendor', label: 'Vendor name', options: unique(vendors.map((v) => v.name)) },
      { key: 'country', label: 'Country', options: unique(vendors.map((v) => v.country)) },
    ]
  }, [vendors])

  const totalPages = Math.ceil(filteredVendors.length / ITEMS_PER_PAGE) || 1
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedVendors = filteredVendors.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  // Trigger search on Enter key press in Find Vendor modal
  const handleFindVendorSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (!findSearchQuery.trim()) return

      setIsSearchingVendor(true)
      setHasSearched(false)
      setSelectedSearchResult(null)

      setTimeout(() => {
        setIsSearchingVendor(false)
        setHasSearched(true)

        // Auto-match vendor country
        const query = findSearchQuery.trim().toLowerCase()
        const matched = searchVendorResults.find(
          (r) =>
            r.name.toLowerCase().includes(query) ||
            r.domain.toLowerCase().includes(query) ||
            query.includes(r.name.toLowerCase())
        )
        if (matched && matched.country) {
          setFindCountry(matched.country)
        } else {
          setFindCountry('United Arab Emirates')
        }
      }, 700)
    }
  }

  // Email validation helper for recipient tag inputs
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const handleKeyDownFindRecipient = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const trimmed = findRecipientInput.trim().replace(/,/g, '')
      if (!trimmed) return
      if (findRecipients.length >= 5) {
        setFindRecipientError('Maximum 5 recipients can be added.')
        return
      }
      if (!emailRegex.test(trimmed)) {
        setFindRecipientError('Please enter a valid email address.')
        return
      }
      if (findRecipients.includes(trimmed)) {
        setFindRecipientError('Already added.')
        return
      }
      setFindRecipients([...findRecipients, trimmed])
      setFindRecipientInput('')
      setFindRecipientError(null)
    }
  }

  const handleKeyDownManualRecipient = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const trimmed = manualRecipientInput.trim().replace(/,/g, '')
      if (!trimmed) return
      if (manualRecipients.length >= 5) {
        setManualRecipientError('Maximum 5 recipients can be added.')
        return
      }
      if (!emailRegex.test(trimmed)) {
        setManualRecipientError('Please enter a valid email address.')
        return
      }
      if (manualRecipients.includes(trimmed)) {
        setManualRecipientError('Already added.')
        return
      }
      setManualRecipients([...manualRecipients, trimmed])
      setManualRecipientInput('')
      setManualRecipientError(null)
    }
  }

  const handleCloseAddVendorModal = () => {
    setShowAddVendorModal(false)
    setFindSearchQuery('')
    setFindWebsite('')
    setSelectedSearchResult(null)
    setHasSearched(false)
    setIsSearchingVendor(false)
    setFindRecipients([])
    setFindRecipientInput('')
    setFindRecipientError(null)
    setManualDisplayName('')
    setManualLegalName('')
    setManualCountry('')
    setFindCountry('')
    setIsFindCountryOpen(false)
    setIsManualCountryOpen(false)
    setManualWebsite('')
    setManualRecipients([])
    setManualRecipientInput('')
    setManualRecipientError(null)
    setOnboardingMode('find')
  }

  // Handle Add Vendor from Find Flow (Auto-populates website from selected vendor)
  const handleAddVendorFromFind = () => {
    if (findRecipients.length > 5) return
    const vendorTitle =
      findSearchQuery.trim() || (selectedSearchResult ? selectedSearchResult.name : '')
    if (!vendorTitle) return

    const countryObj = worldCountryOptions.find((c) => c.name === findCountry)
    const domainStr =
      findWebsite.replace('https://', '').replace('http://', '').split('/')[0] ||
      (selectedSearchResult ? selectedSearchResult.domain : 'vendor.com')

    const newVendor: VendorRow = {
      id: `v-${Date.now()}`,
      caseId: getNextCaseId(vendors),
      vendorId: getNextVendorId(vendors),
      name: vendorTitle,
      legalName: vendorTitle,
      email: findRecipients[0] || `compliance@${domainStr}`,
      domain: domainStr,
      country: findCountry,
      flag: countryObj ? countryObj.flag : '🌐',
      status: 'Activated',
      score: '88.0',
      recipients: findRecipients.length > 0 ? findRecipients : [`compliance@${domainStr}`],
    }

    setIsAddingVendor(true)
    setAddingVendorName(vendorTitle)

    setTimeout(() => {
      setVendors((prev) => [newVendor, ...prev])
      setFindSearchQuery('')
      setFindWebsite('')
      setFindRecipients([])
      setFindRecipientInput('')
      setHasSearched(false)
      setSelectedSearchResult(null)
      setIsAddingVendor(false)
      setAddingVendorName('')
      setShowAddVendorModal(false)
      showToast(`Added ${newVendor.name} via public lookup.`)
    }, 1500)
  }

  // Handle Manual vendor tab add
  const handleAddVendorManually = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualRecipients.length > 5) return
    if (!manualDisplayName.trim()) return
    const countryObj = worldCountryOptions.find((c) => c.name === manualCountry)
    const domainStr = manualWebsite.replace('https://', '').split('/')[0] || 'vendor.com'
    const newVendor: VendorRow = {
      id: `v-${Date.now()}`,
      caseId: getNextCaseId(vendors),
      vendorId: getNextVendorId(vendors),
      name: manualDisplayName.trim(),
      legalName: manualLegalName.trim() || manualDisplayName.trim(),
      email: manualRecipients[0] || `contact@${domainStr}`,
      domain: domainStr,
      country: manualCountry,
      flag: countryObj ? countryObj.flag : '🌐',
      status: 'Activated',
      score: '80.0',
      recipients: manualRecipients.length > 0 ? manualRecipients : [`contact@${domainStr}`],
    }

    setIsAddingVendor(true)
    setAddingVendorName(manualDisplayName.trim())

    setTimeout(() => {
      setVendors((prev) => [newVendor, ...prev])
      setManualDisplayName('')
      setManualLegalName('')
      setManualRecipients([])
      setManualRecipientInput('')
      setManualWebsite('')
      setIsAddingVendor(false)
      setAddingVendorName('')
      setShowAddVendorModal(false)
      showToast(`Added ${newVendor.name} manually.`)
    }, 1500)
  }

  // Handle Save Edited Vendor
  const handleSaveEditedVendor = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingVendor) return
    if ((editingVendor.recipients || []).length > 5) return

    setVendors(vendors.map((v) => (v.id === editingVendor.id ? editingVendor : v)))
    showToast(`Updated details for ${editingVendor.name}.`)
    setEditingVendor(null)
  }

  // Handle Activate / Deactivate Vendor
  const toggleVendorStatus = (vendor: VendorRow) => {
    setOpenActionMenuId(null)
    const newStatus = vendor.status === 'Activated' ? 'Deactivated' : 'Activated'
    setVendors(vendors.map((v) => (v.id === vendor.id ? { ...v, status: newStatus } : v)))
    showToast(
      newStatus === 'Activated'
        ? `Reactivated vendor ${vendor.name}.`
        : `Deactivated vendor ${vendor.name}.`
    )
  }

  const handleLaunchCall = () => {
    const vendorName = activeDispatchVendor ? activeDispatchVendor.name : 'Vendor'
    setActiveDispatchVendor(null)
    setDispatchSuccessToast(`Voice agent call successfully dispatched to ${vendorName}!`)
    setTimeout(() => {
      setDispatchSuccessToast(null)
    }, 4500)
  }

  if (activeDispatchVendor) {
    const dispatchData: VendorDispatchData = {
      id: activeDispatchVendor.id,
      caseId: activeDispatchVendor.caseId,
      name: activeDispatchVendor.name,
      sublabel: activeDispatchVendor.legalName,
      domain: activeDispatchVendor.domain,
      country: activeDispatchVendor.country,
      flag: activeDispatchVendor.flag,
      email: activeDispatchVendor.email,
      recipients: activeDispatchVendor.recipients,
      usedRoundLabels: USED_ROUND_LABELS[activeDispatchVendor.caseId] ?? [],
    }

    return (
      <ConfigureVendorCallScreen
        vendor={dispatchData}
        onBack={() => setActiveDispatchVendor(null)}
        onComplete={handleLaunchCall}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5 w-full p-6 text-[#0d212c]">
      {/* Toast Notification — subtle light semantic styling */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#f0fdf4] text-[#15803d] px-4 py-3 rounded-xl shadow-md border border-[#bbf7d0] flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Dispatch Success Banner Toast — subtle light semantic styling */}
      {dispatchSuccessToast && (
        <div className="fixed top-5 right-5 z-50 bg-[#f0fdf4] text-[#15803d] text-xs font-bold px-5 py-3.5 rounded-xl shadow-md border border-[#bbf7d0] flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="w-7 h-7 rounded-full bg-[#dcfce7] flex items-center justify-center shrink-0">
            <PhoneCall className="w-3.5 h-3.5 text-[#16a34a]" />
          </div>
          <span>{dispatchSuccessToast}</span>
        </div>
      )}

      {/* Header Bar with Search Bar placed on the LEFT side of the Add Vendor CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xl font-extrabold text-[#0d212c]">Vendors</h2>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vendor name, email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-[#e2e8f0] bg-white text-xs font-medium text-[#0d212c] outline-none focus:border-[#cbd5e1] shadow-xs"
            />
          </div>

          <FilterMenu
            fields={vendorFilterFields}
            values={vendorFilters}
            onChange={(values) => {
              setVendorFilters(values)
              setCurrentPage(1)
            }}
          />

          <button
            onClick={() => {
              setOnboardingMode('find')
              setFindSearchQuery('')
              setFindWebsite('')
              setSelectedSearchResult(null)
              setHasSearched(false)
              setIsSearchingVendor(false)
              setFindRecipients([])
              setFindRecipientInput('')
              setFindRecipientError(null)
              setFindCountry('')
              setManualCountry('')
              setShowAddVendorModal(true)
            }}
            className="bg-[#0d212c] hover:bg-[#122e3d] text-white font-bold py-2 px-5 rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer border-0 shrink-0"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Add Vendor</span>
          </button>
        </div>
      </div>

      {/* Status Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'all', label: 'All Vendors', count: vendors.length },
          {
            key: 'Activated',
            label: 'Activated',
            count: vendors.filter((v) => v.status === 'Activated').length,
          },
          {
            key: 'Deactivated',
            label: 'Deactivated',
            count: vendors.filter((v) => v.status === 'Deactivated').length,
          },
        ].map((chip) => {
          const isSelected = statusFilter === chip.key
          return (
            <button
              key={chip.key}
              onClick={() => {
                setStatusFilter(chip.key as 'all' | 'Activated' | 'Deactivated')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? 'bg-[#36c0c9] text-white font-bold shadow-xs'
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

      {/* Vendors Directory Table */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs overflow-hidden w-full flex flex-col mt-1">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] text-xs font-bold">
                <th className="py-3.5 px-5 whitespace-nowrap">Vendor ID</th>
                <th className="py-3.5 px-5 whitespace-nowrap">Case ID</th>
                <th className="py-3.5 px-5">Vendor Name</th>
                <th className="py-3.5 px-5">Domain</th>
                <th className="py-3.5 px-5">Recipients</th>
                <th className="py-3.5 px-5">Country</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]/60">
              {isAddingVendor && (
                <tr className="bg-[#ddf7f9]/30 border-b border-[#36c0c9]/40 animate-pulse">
                  <td className="py-4 px-5 text-xs font-bold text-[#0d212c] whitespace-nowrap">
                    {getNextVendorId(vendors)}
                  </td>
                  <td className="py-4 px-5 text-xs font-bold text-[#0d212c] whitespace-nowrap">
                    {getNextCaseId(vendors)}
                  </td>
                  <td className="py-4 px-5 font-semibold text-xs text-[#0d212c]">
                    <div className="flex items-center gap-2.5">
                      <Loader2 className="w-4 h-4 animate-spin text-[#36c0c9] shrink-0" />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-extrabold">{addingVendorName || 'New Vendor'}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ddf7f9] text-[#0f766e] flex items-center gap-1 border border-[#36c0c9]/30 w-fit">
                          <Loader2 className="w-3 h-3 animate-spin" /> Adding item to list...
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-xs text-[#64748b] italic">Processing domain...</td>
                  <td className="py-4 px-5 text-xs text-[#64748b]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                  </td>
                  <td className="py-4 px-5 text-xs text-[#64748b]">-</td>
                  <td className="py-4 px-5 text-xs">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#ddf7f9] text-[#0f766e] border border-[#36c0c9]/40">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Adding...</span>
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <Loader2 className="w-4 h-4 animate-spin text-[#36c0c9] ml-auto" />
                  </td>
                </tr>
              )}
              {paginatedVendors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#64748b] text-sm">
                    No vendors matching search criteria.
                  </td>
                </tr>
              ) : (
                paginatedVendors.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className="hover:bg-[#f8fafc] transition cursor-pointer group"
                  >
                    <td className="py-4 px-5 text-xs font-bold text-[#0d212c] whitespace-nowrap">
                      {vendor.vendorId}
                    </td>
                    <td className="py-4 px-5 text-xs font-bold text-[#0d212c] whitespace-nowrap">
                      {vendor.caseId}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex flex-col min-w-0 gap-[2px]">
                        <span
                          className="font-bold text-[#0d212c] text-xs group-hover:text-[#36c0c9] transition truncate"
                          title={vendor.name}
                        >
                          {vendor.name}
                        </span>
                        <span
                          className="text-[11px] font-medium text-[#64748b] truncate mt-[2px]"
                          title={vendor.legalName}
                        >
                          {vendor.legalName}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-5 text-xs">
                      {vendor.domain ? (
                        <a
                          href={`https://${vendor.domain}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0d212c] font-medium underline hover:text-[#36c0c9] transition truncate block max-w-[160px]"
                          title={vendor.domain}
                        >
                          {vendor.domain}
                        </a>
                      ) : (
                        <span className="text-[#64748b] font-medium">-</span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-xs" onClick={(e) => e.stopPropagation()}>
                      {!vendor.recipients || vendor.recipients.length === 0 ? (
                        <span className="text-[#64748b] font-medium">-</span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5 min-w-[320px] max-w-[380px]">
                          {(expandedRecipients[vendor.id]
                            ? vendor.recipients
                            : vendor.recipients.slice(0, 3)
                          ).map((recEmail, idx) => (
                            <span
                              key={idx}
                              className="inline-block bg-[#f1f5f9] text-[#0d212c] font-medium px-2 py-0.5 rounded-md text-[11px] border border-[#e2e8f0] truncate max-w-[180px]"
                              title={recEmail}
                            >
                              {recEmail}
                            </span>
                          ))}
                          {vendor.recipients.length > 3 && !expandedRecipients[vendor.id] && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setExpandedRecipients((prev) => ({
                                  ...prev,
                                  [vendor.id]: true,
                                }))
                              }}
                              className="inline-block bg-transparent border-0 text-[#64748b] hover:text-[#0d212c] font-bold text-[11px] px-1 py-0.5 transition cursor-pointer shrink-0"
                              title="Click to view all recipients"
                            >
                              +{vendor.recipients.length - 3}
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    <td
                      className="py-4 px-5 text-xs text-[#0d212c] font-medium truncate"
                      title={`${vendor.country}`}
                    >
                      <div className="inline-flex items-center gap-2">
                        <CountryFlag country={vendor.country} />
                        <span>{vendor.country}</span>
                      </div>
                    </td>

                    <td className="py-4 px-5 text-xs">
                      {vendor.status === 'Activated' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]">
                          Activated
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]">
                          Deactivated
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-right relative">
                      <div className="inline-block text-left">
                        <button
                          onClick={() =>
                            setOpenActionMenuId(openActionMenuId === vendor.id ? null : vendor.id)
                          }
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#0d212c] hover:bg-slate-100 transition cursor-pointer border-0"
                          title="Actions menu"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openActionMenuId === vendor.id && (
                          <div className="absolute right-5 top-12 z-40 bg-white rounded-xl border border-[#e2e8f0] shadow-xl w-44 py-1 animate-in fade-in zoom-in-95 duration-150">
                            <button
                              disabled={vendor.status === 'Deactivated'}
                              onClick={() => {
                                if (vendor.status === 'Deactivated') return
                                setOpenActionMenuId(null)
                                setActiveDispatchVendor(vendor)
                              }}
                              title={
                                vendor.status === 'Deactivated'
                                  ? 'Cannot dispatch call for a deactivated vendor'
                                  : 'Dispatch Call'
                              }
                              className={`w-full px-4 py-2.5 text-left text-xs font-semibold border-0 bg-transparent transition ${
                                vendor.status === 'Deactivated'
                                  ? 'text-[#94a3b8] opacity-40 cursor-not-allowed'
                                  : 'text-[#334155] hover:text-[#0d212c] hover:bg-slate-50 cursor-pointer'
                              }`}
                            >
                              Dispatch Call
                            </button>

                            <button
                              disabled={vendor.status === 'Deactivated'}
                              onClick={() => {
                                if (vendor.status === 'Deactivated') return
                                setOpenActionMenuId(null)
                                setEditingVendor(vendor)
                              }}
                              title={
                                vendor.status === 'Deactivated'
                                  ? 'Cannot edit details for a deactivated vendor'
                                  : 'Edit Details'
                              }
                              className={`w-full px-4 py-2.5 text-left text-xs font-semibold border-0 bg-transparent transition ${
                                vendor.status === 'Deactivated'
                                  ? 'text-[#94a3b8] opacity-40 cursor-not-allowed'
                                  : 'text-[#334155] hover:text-[#0d212c] hover:bg-slate-50 cursor-pointer'
                              }`}
                            >
                              Edit Details
                            </button>

                            {vendor.status === 'Activated' ? (
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null)
                                  setConfirmStatusVendor({
                                    vendor,
                                    targetStatus: 'Deactivated',
                                  })
                                }}
                                className="w-full px-4 py-2.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer transition border-t border-slate-100 bg-transparent"
                              >
                                Deactivate Vendor
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null)
                                  setConfirmStatusVendor({
                                    vendor,
                                    targetStatus: 'Activated',
                                  })
                                }}
                                className="w-full px-4 py-2.5 text-left text-xs font-semibold text-emerald-600 hover:bg-emerald-50 cursor-pointer transition border-t border-slate-100 bg-transparent"
                              >
                                Reactivate Vendor
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredVendors.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#e2e8f0] bg-[#f8fafc]">
            <div className="text-xs text-[#64748b] font-medium">
              Showing page <span className="font-semibold text-[#0d212c]">{currentPage}</span> of{' '}
              <span className="font-semibold text-[#0d212c]">{totalPages}</span>
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

      {/* Edit Vendor Details Popup Modal */}
      {editingVendor && (
        <div className="fixed inset-0 z-50 bg-[#0d212c]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#e2e8f0] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#e2e8f0] mb-5">
              <h3 className="text-lg font-bold text-[#0d212c]">Edit vendor details</h3>
              <button
                type="button"
                onClick={() => {
                  setEditingVendor(null)
                  setEditRecipientInput('')
                  setEditRecipientError(null)
                }}
                className="text-[#94a3b8] hover:text-[#0d212c] transition cursor-pointer border-0 bg-transparent p-0"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedVendor} className="flex flex-col gap-4">
              {/* Vendor name */}
              <div>
                <label className="block text-xs font-bold text-[#0d212c] mb-1.5">
                  Vendor name <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={editingVendor.name}
                  onChange={(e) => setEditingVendor({ ...editingVendor, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 rounded-md border border-[#e2e8f0] text-xs text-[#0d212c] outline-none focus:border-[#cbd5e1]"
                />
              </div>

              {/* Country */}
              <div className="relative">
                <label className="block text-xs font-bold text-[#0d212c] mb-1.5">Country</label>
                <button
                  type="button"
                  onClick={() => setIsEditCountryOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-md border border-[#e2e8f0] bg-white text-left outline-none hover:border-[#cbd5e1] focus:border-[#cbd5e1] cursor-pointer transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CountryFlag country={editingVendor.country} />
                    <span
                      className={`text-xs truncate ${
                        !editingVendor.country ? 'text-[#94a3b8]' : 'text-[#0d212c]'
                      }`}
                    >
                      {editingVendor.country || 'Select country'}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-[#94a3b8] shrink-0 transition-transform duration-200 ${
                      isEditCountryOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isEditCountryOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsEditCountryOpen(false)}
                    />
                    <div className="absolute top-full left-0 right-0 z-50 mt-1.5 flex flex-col gap-0.5 bg-white p-1.5 rounded-2xl border border-[#e2e8f0] shadow-2xl max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                      {worldCountryOptions.map((c) => {
                        const isSelected = editingVendor.country === c.name
                        return (
                          <div
                            key={c.name}
                            onClick={() => {
                              const cObj = worldCountryOptions.find((opt) => opt.name === c.name)
                              setEditingVendor({
                                ...editingVendor,
                                country: c.name,
                                flag: cObj ? cObj.flag : '🌐',
                              })
                              setIsEditCountryOpen(false)
                            }}
                            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs cursor-pointer transition ${
                              isSelected
                                ? 'bg-[#f1f5f9] font-bold text-[#0d212c]'
                                : 'hover:bg-[#f8fafc] text-[#0d212c]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <CountryFlag country={c.name} />
                              <span>{c.name}</span>
                            </div>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-[#36c0c9] shrink-0" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-xs font-bold text-[#0d212c] mb-1.5">Website URL</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={editingVendor.website || ''}
                  onChange={(e) => setEditingVendor({ ...editingVendor, website: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-md border border-[#e2e8f0] text-xs text-[#0d212c] outline-none focus:border-[#cbd5e1]"
                />
              </div>

              {/* Recipients tag input */}
              <div className="flex flex-col gap-1.5">
                <label className="block text-xs font-bold text-[#0d212c]">Recipients</label>
                <input
                  type="text"
                  placeholder={
                    (editingVendor.recipients || []).length >= 5
                      ? 'Maximum 5 recipients reached'
                      : 'Type email and press Enter'
                  }
                  value={editRecipientInput}
                  disabled={(editingVendor.recipients || []).length >= 5}
                  onChange={(e) => {
                    setEditRecipientInput(e.target.value)
                    setEditRecipientError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      const trimmed = editRecipientInput.trim().replace(/,/g, '')
                      if (!trimmed) return
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                      if (!emailRegex.test(trimmed)) {
                        setEditRecipientError('Please enter a valid email address.')
                        return
                      }
                      const existingRecipients = editingVendor.recipients || []
                      if (existingRecipients.includes(trimmed)) {
                        setEditRecipientError('This email has already been added.')
                        return
                      }
                      setEditingVendor({
                        ...editingVendor,
                        recipients: [...existingRecipients, trimmed],
                      })
                      setEditRecipientInput('')
                      setEditRecipientError(null)
                    }
                  }}
                  className={`w-full px-3.5 py-2 rounded-md border text-xs text-[#0d212c] outline-none focus:border-[#cbd5e1] disabled:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed ${
                    editRecipientError ? 'border-red-500' : 'border-[#e2e8f0]'
                  }`}
                />
                {editRecipientError && (
                  <span className="text-xs text-red-600">{editRecipientError}</span>
                )}
                {(editingVendor.recipients || []).length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {(editingVendor.recipients || []).map((rec) => (
                      <span
                        key={rec}
                        className="inline-flex items-center gap-1.5 bg-[#f1f5f9] text-[#0d212c] text-xs font-semibold px-3 py-1.5 rounded-full border border-[#cbd5e1]"
                      >
                        {rec}
                        <button
                          type="button"
                          onClick={() =>
                            setEditingVendor({
                              ...editingVendor,
                              recipients: (editingVendor.recipients || []).filter((r) => r !== rec),
                            })
                          }
                          className="p-0.5 hover:bg-slate-200 rounded-full text-slate-500 hover:text-red-600 transition cursor-pointer border-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {(editingVendor.recipients || []).length > 5 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>
                      Maximum 5 recipients allowed. Please remove{' '}
                      {(editingVendor.recipients || []).length - 5} recipient(s) to continue.
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingVendor(null)
                    setEditRecipientInput('')
                    setEditRecipientError(null)
                  }}
                  className="px-4 py-2 rounded-lg border border-[#e2e8f0] text-xs font-semibold text-[#0d212c] hover:bg-slate-50 cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={(editingVendor.recipients || []).length > 5}
                  className="bg-[#0d212c] hover:bg-[#122e3d] text-white font-bold text-xs px-5 py-2 rounded-lg cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal Popup for Activating / Deactivating Vendor (styled like Logout Popup) */}
      {confirmStatusVendor && (
        <div className="fixed inset-0 z-50 bg-[#0d212c]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-8 sm:p-10 shadow-2xl border border-[#e2e8f0] text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200 min-h-[240px] justify-center">
            <button
              type="button"
              onClick={() => setConfirmStatusVendor(null)}
              className="absolute top-5 right-5 text-[#94a3b8] hover:text-[#0d212c] transition cursor-pointer border-0 bg-transparent p-0"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-2xs ${
                confirmStatusVendor.targetStatus === 'Deactivated'
                  ? 'bg-red-50 text-red-600 border-red-100'
                  : 'bg-[#ddf7f9] text-[#36c0c9] border-[#b2ecf2]'
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#0d212c] mb-1.5">
                {confirmStatusVendor.targetStatus === 'Deactivated'
                  ? 'Deactivate Vendor'
                  : 'Reactivate Vendor'}
              </h3>
              <p className="text-xs text-[#64748b] leading-relaxed max-w-md">
                {confirmStatusVendor.targetStatus === 'Deactivated'
                  ? `Are you sure you want to deactivate ${confirmStatusVendor.vendor.name}?`
                  : `Are you sure you want to reactivate ${confirmStatusVendor.vendor.name}?`}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 w-full mt-2">
              <button
                type="button"
                onClick={() => setConfirmStatusVendor(null)}
                className="px-6 py-3 rounded-lg border border-[#e2e8f0] text-xs font-bold text-[#0d212c] hover:bg-slate-50 cursor-pointer flex-1 bg-transparent transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  toggleVendorStatus(confirmStatusVendor.vendor)
                  setConfirmStatusVendor(null)
                }}
                className={`px-6 py-3 rounded-lg text-white text-xs font-bold cursor-pointer flex-1 border-0 transition shadow-2xs ${
                  confirmStatusVendor.targetStatus === 'Deactivated'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-[#36c0c9] hover:bg-[#2badb6]'
                }`}
              >
                {confirmStatusVendor.targetStatus === 'Deactivated' ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Vendor Flow Popup Modal */}
      {showAddVendorModal && (
        <div className="fixed inset-0 z-50 bg-[#0d212c]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#e2e8f0] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#e2e8f0] mb-5">
              <div>
                <h3 className="text-lg font-extrabold text-[#0d212c]">Add Vendor</h3>
                <p className="text-xs text-[#64748b] mt-0.5 font-medium">
                  {onboardingMode === 'find'
                    ? 'Search public registry for vendor metadata or enter details manually.'
                    : 'Manually register supplier profile for risk due diligence.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseAddVendorModal}
                className="text-[#94a3b8] hover:text-[#0d212c] transition cursor-pointer border-0 bg-transparent p-0"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {onboardingMode === 'find' ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1 relative">
                    <div className="flex items-center gap-1.5 mb-1">
                      <label className="block text-xs font-bold text-[#0d212c]">
                        Vendor legal name <span className="text-red-500 font-bold">*</span>
                      </label>
                      <div className="relative group cursor-pointer">
                        <Info className="w-3.5 h-3.5 text-[#64748b]" />
                        <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute left-1/2 -translate-x-1/2 bottom-6 z-50 w-64 bg-[#0d212c] text-white text-xs p-2.5 rounded-xl shadow-xl border border-white/10 text-center">
                          Search will start when you press Enter.
                        </div>
                      </div>
                    </div>

                    {/* Input with Enter key trigger & circular progress spinner on right */}
                    <div className="relative flex items-center w-full">
                      <input
                        type="text"
                        placeholder="Type vendor name & press Enter..."
                        value={findSearchQuery}
                        onChange={(e) => {
                          setFindSearchQuery(e.target.value)
                          if (!e.target.value.trim()) {
                            setSelectedSearchResult(null)
                            setFindWebsite('')
                            setFindCountry('')
                          } else if (
                            selectedSearchResult &&
                            e.target.value !== selectedSearchResult.name
                          ) {
                            setSelectedSearchResult(null)
                            setFindWebsite('')
                          }
                        }}
                        onKeyDown={handleFindVendorSearchKeyDown}
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-md border border-[#e2e8f0] text-xs text-[#0d212c] outline-none focus:border-[#cbd5e1]"
                      />
                      {isSearchingVendor && (
                        <Loader2 className="animate-spin w-4 h-4 text-[#36c0c9] absolute right-3 pointer-events-none" />
                      )}
                    </div>

                    {/* Floating Custom Dropdown List (does not increase modal height) */}
                    {hasSearched && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1.5 flex flex-col gap-1.5 bg-white p-3 rounded-2xl border border-[#e2e8f0] shadow-2xl max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                        <span className="text-[10px] font-extrabold uppercase text-[#64748b] tracking-wider mb-1">
                          SELECT MATCHING VENDOR RESULT (
                          {
                            searchVendorResults.filter(
                              (r) =>
                                !findSearchQuery.trim() ||
                                r.name.toLowerCase().includes(findSearchQuery.toLowerCase()) ||
                                r.domain.toLowerCase().includes(findSearchQuery.toLowerCase())
                            ).length
                          }{' '}
                          FOUND)
                        </span>
                        {searchVendorResults.filter(
                          (r) =>
                            !findSearchQuery.trim() ||
                            r.name.toLowerCase().includes(findSearchQuery.toLowerCase()) ||
                            r.domain.toLowerCase().includes(findSearchQuery.toLowerCase())
                        ).length > 0 ? (
                          searchVendorResults
                            .filter(
                              (r) =>
                                !findSearchQuery.trim() ||
                                r.name.toLowerCase().includes(findSearchQuery.toLowerCase()) ||
                                r.domain.toLowerCase().includes(findSearchQuery.toLowerCase())
                            )
                            .map((res) => {
                              const isSelected =
                                selectedSearchResult?.id === res.id || findSearchQuery === res.name
                              return (
                                <div
                                  key={res.id}
                                  onClick={() => {
                                    setSelectedSearchResult(res)
                                    setFindSearchQuery(res.name) // Adds vendor name to input field
                                    setHasSearched(false) // Closes the search results list
                                    if (res.domain) {
                                      const formattedUrl =
                                        res.domain.startsWith('http://') ||
                                        res.domain.startsWith('https://')
                                          ? res.domain
                                          : `https://${res.domain}`
                                      setFindWebsite(formattedUrl)
                                    }
                                    if (res.country) {
                                      setFindCountry(res.country)
                                    } else {
                                      setFindCountry('United Arab Emirates')
                                    }
                                  }}
                                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                                    isSelected
                                      ? 'bg-[#f1f5f9] border-transparent'
                                      : 'bg-white border-[#e2e8f0] hover:bg-[#f8fafc]'
                                  }`}
                                >
                                  <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-xs text-[#0d212c] truncate">
                                        {res.name}
                                      </span>
                                      {isSelected && (
                                        <Check className="w-3.5 h-3.5 text-[#64748b] shrink-0" />
                                      )}
                                    </div>
                                    <span className="text-[11px] text-[#64748b] truncate">
                                      {res.domain}
                                    </span>
                                  </div>

                                  <StatusChip
                                    label={res.confidence}
                                    status={res.confidenceType}
                                    dot={false}
                                  />
                                </div>
                              )
                            })
                        ) : (
                          <div className="text-xs text-[#64748b] py-3 text-center">
                            No vendor found in the public registry. You can add the vendor manually.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Country */}
                  <div className="relative">
                    <label className="block text-xs font-bold text-[#0d212c] mb-1.5">Country</label>
                    <button
                      type="button"
                      onClick={() => setIsFindCountryOpen((prev) => !prev)}
                      className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-md border border-[#e2e8f0] bg-white text-left outline-none hover:border-[#cbd5e1] focus:border-[#cbd5e1] cursor-pointer transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CountryFlag country={findCountry} />
                        <span
                          className={`text-xs truncate ${
                            !findCountry ? 'text-[#94a3b8]' : 'text-[#0d212c]'
                          }`}
                        >
                          {findCountry || 'Select country'}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-[#94a3b8] shrink-0 transition-transform duration-200 ${
                          isFindCountryOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isFindCountryOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsFindCountryOpen(false)}
                        />
                        <div className="absolute top-full left-0 right-0 z-50 mt-1.5 flex flex-col gap-0.5 bg-white p-1.5 rounded-2xl border border-[#e2e8f0] shadow-2xl max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                          {worldCountryOptions.map((c) => {
                            const isSelected = findCountry === c.name
                            return (
                              <div
                                key={c.name}
                                onClick={() => {
                                  setFindCountry(c.name)
                                  setIsFindCountryOpen(false)
                                }}
                                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs cursor-pointer transition ${
                                  isSelected
                                    ? 'bg-[#f1f5f9] font-bold text-[#0d212c]'
                                    : 'hover:bg-[#f8fafc] text-[#0d212c]'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <CountryFlag country={c.name} />
                                  <span>{c.name}</span>
                                </div>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-[#36c0c9] shrink-0" />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Website URL on next line (Auto-populated and Non-editable) */}
                  <div>
                    <label className="block text-xs font-bold text-[#0d212c] mb-1.5">
                      Website URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://"
                      value={findWebsite}
                      readOnly
                      tabIndex={-1}
                      className="w-full px-3.5 py-2.5 rounded-md border border-[#e2e8f0] bg-[#f8fafc] text-xs text-[#64748b] cursor-not-allowed outline-none select-none"
                    />
                  </div>

                  {/* Recipients tag-input (find flow) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="block text-xs font-bold text-[#0d212c] mb-0.5">
                      Recipients
                    </label>
                    <input
                      type="email"
                      placeholder={
                        findRecipients.length >= 5
                          ? 'Maximum 5 recipients reached'
                          : 'Enter email and press Enter...'
                      }
                      value={findRecipientInput}
                      disabled={findRecipients.length >= 5}
                      onChange={(e) => {
                        setFindRecipientInput(e.target.value)
                        if (findRecipientError) setFindRecipientError(null)
                      }}
                      onKeyDown={handleKeyDownFindRecipient}
                      className={`w-full px-3.5 py-2.5 rounded-md border text-xs text-[#0d212c] outline-none transition disabled:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed ${
                        findRecipientError
                          ? 'border-red-500'
                          : 'border-[#e2e8f0] focus:border-[#cbd5e1]'
                      }`}
                    />
                    <div className="flex items-center justify-between text-[11px] text-[#64748b]">
                      <span>Maximum 5 recipients can be added</span>
                      <span>{findRecipients.length}/5</span>
                    </div>
                    {findRecipientError && (
                      <span className="text-xs text-red-600 font-medium">{findRecipientError}</span>
                    )}
                    {findRecipients.length > 5 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <span>
                          Maximum 5 recipients allowed. Please remove {findRecipients.length - 5}{' '}
                          recipient(s) to continue.
                        </span>
                      </div>
                    )}
                    {findRecipients.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        {findRecipients.map((rec) => (
                          <span
                            key={rec}
                            className="inline-flex items-center gap-1.5 bg-[#f1f5f9] text-[#0d212c] text-xs font-semibold px-3 py-1.5 rounded-full border border-[#cbd5e1]"
                          >
                            {rec}
                            <button
                              type="button"
                              onClick={() =>
                                setFindRecipients(findRecipients.filter((r) => r !== rec))
                              }
                              className="p-0.5 hover:bg-slate-200 rounded-full text-slate-500 hover:text-red-600 transition cursor-pointer border-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* "Can't find vendor?" — centered, no separator */}
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => setOnboardingMode('manual')}
                    className="text-xs cursor-pointer transition bg-transparent border-0 self-center p-0 flex items-center gap-1"
                  >
                    <span className="text-[#64748b]">Can&apos;t find vendor?</span>
                    <span className="text-[#36c0c9] font-bold hover:underline">
                      Add vendor manually
                    </span>
                  </button>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCloseAddVendorModal}
                      className="px-4 py-2.5 rounded-lg border border-[#e2e8f0] text-xs font-semibold text-[#0d212c] hover:bg-slate-50 cursor-pointer bg-transparent"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={
                        isAddingVendor || !selectedSearchResult || findRecipients.length > 5
                      }
                      onClick={handleAddVendorFromFind}
                      className="bg-[#0d212c] hover:bg-[#122e3d] text-white font-bold text-xs px-6 py-2.5 rounded-lg transition cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed border-0 flex items-center justify-center gap-2"
                    >
                      {isAddingVendor ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Adding vendor...</span>
                        </>
                      ) : (
                        <span>Add vendor</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Manual Vendor Flow — stacked layout so height matches Find Vendor */
              <form onSubmit={handleAddVendorManually} className="flex flex-col gap-4">
                <div className="flex flex-col gap-4">
                  {/* Display name */}
                  <div>
                    <label className="block text-xs font-bold text-[#0d212c] mb-1.5">
                      Display name <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter display name"
                      value={manualDisplayName}
                      onChange={(e) => setManualDisplayName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-md border border-[#e2e8f0] text-xs text-[#0d212c] outline-none focus:border-[#cbd5e1]"
                    />
                  </div>

                  {/* Legal name */}
                  <div>
                    <label className="block text-xs font-bold text-[#0d212c] mb-1.5">
                      Legal name
                    </label>
                    <input
                      type="text"
                      placeholder="Defaults to display name"
                      value={manualLegalName}
                      onChange={(e) => setManualLegalName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-md border border-[#e2e8f0] text-xs text-[#0d212c] outline-none focus:border-[#cbd5e1]"
                    />
                  </div>

                  {/* Country + Website on same row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-xs font-bold text-[#0d212c] mb-1.5">
                        Country
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsManualCountryOpen((prev) => !prev)}
                        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-md border border-[#e2e8f0] bg-white text-left outline-none hover:border-[#cbd5e1] focus:border-[#cbd5e1] cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CountryFlag country={manualCountry} />
                          <span
                            className={`text-xs truncate ${
                              !manualCountry ? 'text-[#94a3b8]' : 'text-[#0d212c]'
                            }`}
                          >
                            {manualCountry || 'Select country'}
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-[#94a3b8] shrink-0 transition-transform duration-200 ${
                            isManualCountryOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {isManualCountryOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsManualCountryOpen(false)}
                          />
                          <div className="absolute top-full left-0 right-0 z-50 mt-1.5 flex flex-col gap-0.5 bg-white p-1.5 rounded-2xl border border-[#e2e8f0] shadow-2xl max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                            {worldCountryOptions.map((c) => {
                              const isSelected = manualCountry === c.name
                              return (
                                <div
                                  key={c.name}
                                  onClick={() => {
                                    setManualCountry(c.name)
                                    setIsManualCountryOpen(false)
                                  }}
                                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs cursor-pointer transition ${
                                    isSelected
                                      ? 'bg-[#f1f5f9] font-bold text-[#0d212c]'
                                      : 'hover:bg-[#f8fafc] text-[#0d212c]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <CountryFlag country={c.name} />
                                    <span>{c.name}</span>
                                  </div>
                                  {isSelected && (
                                    <Check className="w-3.5 h-3.5 text-[#36c0c9] shrink-0" />
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0d212c] mb-1.5">
                        Website
                      </label>
                      <input
                        type="text"
                        placeholder="https://"
                        value={manualWebsite}
                        onChange={(e) => setManualWebsite(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-md border border-[#e2e8f0] text-xs text-[#0d212c] outline-none focus:border-[#cbd5e1]"
                      />
                    </div>
                  </div>

                  {/* Recipients tag-input (manual flow) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="block text-xs font-bold text-[#0d212c] mb-0.5">
                      Recipients
                    </label>
                    <input
                      type="email"
                      placeholder={
                        manualRecipients.length >= 5
                          ? 'Maximum 5 recipients reached'
                          : 'Enter email and press Enter...'
                      }
                      value={manualRecipientInput}
                      disabled={manualRecipients.length >= 5}
                      onChange={(e) => {
                        setManualRecipientInput(e.target.value)
                        if (manualRecipientError) setManualRecipientError(null)
                      }}
                      onKeyDown={handleKeyDownManualRecipient}
                      className={`w-full px-3.5 py-2.5 rounded-md border text-xs text-[#0d212c] outline-none transition disabled:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed ${
                        manualRecipientError
                          ? 'border-red-500'
                          : 'border-[#e2e8f0] focus:border-[#cbd5e1]'
                      }`}
                    />
                    <div className="flex items-center justify-between text-[11px] text-[#64748b]">
                      <span>Maximum 5 recipients can be added</span>
                      <span>{manualRecipients.length}/5</span>
                    </div>
                    {manualRecipientError && (
                      <span className="text-xs text-red-600 font-medium">
                        {manualRecipientError}
                      </span>
                    )}
                    {manualRecipients.length > 5 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <span>
                          Maximum 5 recipients allowed. Please remove {manualRecipients.length - 5}{' '}
                          recipient(s) to continue.
                        </span>
                      </div>
                    )}
                    {manualRecipients.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        {manualRecipients.map((rec) => (
                          <span
                            key={rec}
                            className="inline-flex items-center gap-1.5 bg-[#f1f5f9] text-[#0d212c] text-xs font-semibold px-3 py-1.5 rounded-full border border-[#cbd5e1]"
                          >
                            {rec}
                            <button
                              type="button"
                              onClick={() =>
                                setManualRecipients(manualRecipients.filter((r) => r !== rec))
                              }
                              className="p-0.5 hover:bg-slate-200 rounded-full text-slate-500 hover:text-red-600 transition cursor-pointer border-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setOnboardingMode('find')}
                    className="text-[#64748b] hover:text-[#0d212c] font-semibold text-xs transition cursor-pointer bg-transparent border-0 p-0"
                  >
                    ← Back to find vendor
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCloseAddVendorModal}
                      className="px-4 py-2.5 rounded-lg border border-[#e2e8f0] text-xs font-semibold text-[#0d212c] hover:bg-slate-50 cursor-pointer bg-transparent"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={
                        isAddingVendor || !manualDisplayName.trim() || manualRecipients.length > 5
                      }
                      className="bg-[#0d212c] hover:bg-[#122e3d] text-white font-bold text-xs px-6 py-2.5 rounded-lg transition cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed border-0 flex items-center justify-center gap-2"
                    >
                      {isAddingVendor ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Adding vendor...</span>
                        </>
                      ) : (
                        <span>Add vendor</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
