'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  Upload,
  Plus,
  Sparkles,
  CheckCircle2,
  Check,
  Trash2,
  FileText,
  X,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Info,
  Download,
  AlertTriangle,
  Loader2,
  Search,
} from 'lucide-react'
import { Input } from '@/tdd-admin/components/atoms/Input'
import { Textarea } from '@/tdd-admin/components/atoms/Textarea'
import { StatusChip } from '@/tdd-admin/components/atoms/StatusChip'
import {
  QuestionnaireDetailScreen,
  QuestionnaireDetailData,
  QuestionItem,
} from './QuestionnaireDetailScreen'

interface Questionnaire {
  id: string
  title: string
  description: string
  fileType: 'PDF' | 'DOCX' | 'MD' | 'XLSX' | 'AI'
  questionsCount: number
  status: 'Ready' | 'Draft' | 'Processing'
  questions?: QuestionItem[]
}

type QuestionDraft = Omit<QuestionItem, 'id'>

// Question bank the mock AI generator draws from, grouped by focus area
const AI_QUESTION_BANK: { area: string; keywords: string[]; questions: QuestionDraft[] }[] = [
  {
    area: 'Security',
    keywords: ['security', 'cyber', 'risk', 'threat', 'vulnerab', 'penetration', 'access'],
    questions: [
      {
        question: 'Describe how you encrypt customer data at rest and in transit.',
        responseCue:
          'Name the encryption standards (e.g. AES-256, TLS 1.2+) and explain key management and rotation.',
        researchNeeded: false,
        attachmentRequired: false,
        requiredQuestion: true,
      },
      {
        question:
          'Describe your identity and access management controls, including SSO, MFA and least-privilege access.',
        responseCue:
          'State whether MFA is enforced for all users and admins, and how access reviews are performed.',
        researchNeeded: false,
        attachmentRequired: false,
        requiredQuestion: true,
      },
      {
        question: 'Provide your most recent penetration test summary and remediation status.',
        responseCue:
          'Include the test date, scope, testing firm, critical/high findings and their remediation timelines.',
        researchNeeded: false,
        attachmentRequired: true,
        requiredQuestion: true,
      },
      {
        question: 'How do you identify, prioritise and remediate vulnerabilities in the solution?',
        responseCue:
          'Describe scanning tools and frequency, severity SLAs, and how patches are deployed to production.',
        researchNeeded: false,
        attachmentRequired: false,
        requiredQuestion: false,
      },
      {
        question: 'Provide your current ISO/IEC 27001 certificate or SOC 2 Type II report.',
        responseCue: 'Attach the certificate or report and state its validity period and scope.',
        researchNeeded: true,
        attachmentRequired: true,
        requiredQuestion: true,
      },
    ],
  },
  {
    area: 'Data privacy',
    keywords: ['privacy', 'data protection', 'gdpr', 'personal', 'pii', 'phi', 'residency'],
    questions: [
      {
        question: 'Where is customer data stored, and can data residency be restricted to the UAE?',
        responseCue:
          'List hosting regions and providers, and explain how residency restrictions are enforced.',
        researchNeeded: true,
        attachmentRequired: false,
        requiredQuestion: true,
      },
      {
        question: 'How do you handle data subject requests such as access, correction and erasure?',
        responseCue:
          'Describe the request workflow, response timelines and how completion is verified.',
        researchNeeded: false,
        attachmentRequired: false,
        requiredQuestion: false,
      },
      {
        question: 'Which sub-processors have access to customer data, and how are they assessed?',
        responseCue:
          'Provide the sub-processor list and describe due-diligence and contractual safeguards.',
        researchNeeded: true,
        attachmentRequired: true,
        requiredQuestion: false,
      },
    ],
  },
  {
    area: 'AI governance',
    keywords: [' ai', 'ai ', 'model', 'machine learning', 'algorithm', 'llm'],
    questions: [
      {
        question: 'How do you test AI models for bias, accuracy and performance drift?',
        responseCue:
          'Describe evaluation datasets, metrics, monitoring frequency and thresholds that trigger retraining.',
        researchNeeded: false,
        attachmentRequired: true,
        requiredQuestion: true,
      },
      {
        question: 'Is customer data used to train or fine-tune your AI models?',
        responseCue:
          'State whether customer data is used for training, how consent is obtained and how opt-out works.',
        researchNeeded: false,
        attachmentRequired: false,
        requiredQuestion: true,
      },
      {
        question: 'What human oversight exists for AI-generated outputs?',
        responseCue:
          'Explain review steps, escalation paths and how users can challenge or correct outputs.',
        researchNeeded: false,
        attachmentRequired: false,
        requiredQuestion: false,
      },
    ],
  },
  {
    area: 'Cloud infrastructure',
    keywords: ['cloud', 'infrastructure', 'hosting', 'saas', 'aws', 'azure', 'tenant'],
    questions: [
      {
        question: 'How is customer data isolated in your multi-tenant environment?',
        responseCue:
          'Describe logical or physical isolation controls and how tenant separation is tested.',
        researchNeeded: false,
        attachmentRequired: false,
        requiredQuestion: true,
      },
      {
        question: 'How are production infrastructure changes reviewed and approved?',
        responseCue:
          'Describe change management, infrastructure-as-code reviews and segregation of duties.',
        researchNeeded: false,
        attachmentRequired: false,
        requiredQuestion: false,
      },
    ],
  },
  {
    area: 'Clinical safety',
    keywords: ['clinical', 'health', 'patient', 'medical', 'hipaa', 'doh'],
    questions: [
      {
        question:
          'Does the solution influence clinical decisions, and how is patient safety risk managed?',
        responseCue:
          'Provide the hazard log or clinical risk assessment and name the accountable clinical safety officer.',
        researchNeeded: false,
        attachmentRequired: true,
        requiredQuestion: true,
      },
      {
        question: 'Which healthcare regulations and DOH standards does the solution comply with?',
        responseCue:
          'List applicable regulations and attach evidence of compliance or certification.',
        researchNeeded: true,
        attachmentRequired: true,
        requiredQuestion: false,
      },
    ],
  },
  {
    area: 'Business continuity',
    keywords: [
      'continuity',
      'disaster',
      'recovery',
      'resilience',
      'backup',
      'incident',
      'availability',
    ],
    questions: [
      {
        question:
          'Describe your incident-response process and the time to notify affected customers.',
        responseCue:
          'Provide the notification window (e.g. within 24 hours), triage workflow and post-incident review format.',
        researchNeeded: false,
        attachmentRequired: true,
        requiredQuestion: true,
      },
      {
        question: 'What are your RTO and RPO targets, and when were they last tested?',
        responseCue:
          'State the targets, the date and result of the last failover or recovery test.',
        researchNeeded: false,
        attachmentRequired: false,
        requiredQuestion: false,
      },
    ],
  },
]

const GENERAL_QUESTIONS: QuestionDraft[] = [
  {
    question:
      'State the legal name, headquarters location and ownership structure of your organisation.',
    responseCue: 'Include the registered entity, city and country, and any parent company.',
    researchNeeded: true,
    attachmentRequired: false,
    requiredQuestion: true,
  },
  {
    question: 'Describe the solution in scope and the services it provides to M42.',
    responseCue: 'Summarise the main functions, deployment model and who will use it.',
    researchNeeded: false,
    attachmentRequired: false,
    requiredQuestion: true,
  },
]

const AI_QUESTION_TARGET = 10

// Character limits for the Generate with AI form
const AI_TITLE_MIN = 10
const AI_TITLE_MAX = 100
const AI_INSTRUCTIONS_MIN = 50
const AI_INSTRUCTIONS_MAX = 2000

// Mock AI generation: picks focus areas from the title and instructions, then drafts questions
const generateQuestionnaire = (title: string, instructions: string) => {
  const text = ` ${title} ${instructions} `.toLowerCase()
  const matched = AI_QUESTION_BANK.filter((group) => group.keywords.some((k) => text.includes(k)))
  const focusAreas = matched.length > 0 ? matched : AI_QUESTION_BANK.slice(0, 2)
  const fallbackAreas = AI_QUESTION_BANK.filter((group) => !focusAreas.includes(group))

  const drafts: QuestionDraft[] = [...GENERAL_QUESTIONS]
  for (const group of [...focusAreas, ...fallbackAreas]) {
    for (const question of group.questions) {
      if (drafts.length >= AI_QUESTION_TARGET) break
      drafts.push(question)
    }
  }
  return {
    areas: focusAreas.map((group) => group.area),
    questions: drafts.map((draft, idx) => ({ id: idx + 1, ...draft })),
  }
}

const AI_THINKING_STEP_MS = 1200

export const QuestionnairesScreen: React.FC = () => {
  const [selectedQuestionnaire, setSelectedQuestionnaire] =
    useState<QuestionnaireDetailData | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Ready' | 'Draft'>('all')
  const ITEMS_PER_PAGE = 8

  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([
    {
      id: 'q-1',
      title: 'Technical Questionnaire',
      description:
        'Core architectural, clinical risk, and technical data pipeline compliance questionnaire.',
      fileType: 'PDF',
      questionsCount: 62,
      status: 'Ready',
    },
    {
      id: 'q-2',
      title: 'Data Protection & Privacy',
      description:
        'Comprehensive 45-question audit covering ISMS policies, encryption controls, access management, and incident response.',
      fileType: 'PDF',
      questionsCount: 45,
      status: 'Ready',
    },
    {
      id: 'q-3',
      title: 'Presight Technical & Compliance',
      description:
        'Presight AI platform-specific integration safety, API authorization, and model governance audit.',
      fileType: 'DOCX',
      questionsCount: 50,
      status: 'Draft',
    },
    {
      id: 'q-4',
      title: 'Information Security & Compliance',
      description:
        'Trust Services Criteria evaluation for security, availability, processing integrity, confidentiality, and privacy.',
      fileType: 'DOCX',
      questionsCount: 38,
      status: 'Ready',
    },
    {
      id: 'q-5',
      title: 'SOC 2 Type II Vendor Risk Assessment',
      description:
        'SOC 2 Type II controls auditing third-party hosting, access controls, and data residency.',
      fileType: 'PDF',
      questionsCount: 32,
      status: 'Ready',
    },
    {
      id: 'q-6',
      title: 'HIPAA & Healthcare Data Compliance Checklist',
      description:
        'PHI safeguarding, EHR system integrations, BAA agreements, and UAE DOH data residency verification.',
      fileType: 'PDF',
      questionsCount: 29,
      status: 'Draft',
    },
    {
      id: 'q-7',
      title: 'Third-Party Software Supply Chain Security',
      description:
        'SaaS dependency scanning, SBOM verification, open-source license compliance, and vulnerability disclosure policies.',
      fileType: 'MD',
      questionsCount: 20,
      status: 'Ready',
    },
    {
      id: 'q-8',
      title: 'ISO 27001 ISMS Security Checklist',
      description:
        'Information Security Management System policies and annual audit verification checklist.',
      fileType: 'PDF',
      questionsCount: 40,
      status: 'Ready',
    },
    {
      id: 'q-9',
      title: 'Cloud Infrastructure Audit Questionnaire',
      description:
        'Multi-cloud tenant isolation, IAM role hierarchy, and automated vulnerability remediation audit.',
      fileType: 'PDF',
      questionsCount: 35,
      status: 'Draft',
    },
    {
      id: 'q-10',
      title: 'Clinical AI Safety & Ethics Questionnaire',
      description:
        'Algorithmic bias testing, patient safety monitoring, and diagnostic model performance auditing.',
      fileType: 'DOCX',
      questionsCount: 48,
      status: 'Ready',
    },
    {
      id: 'q-11',
      title: 'UAE DOH Health Data Residency Compliance',
      description:
        'Verification of data residency, local cloud node hosting, and UAE Ministry of Health compliance.',
      fileType: 'PDF',
      questionsCount: 25,
      status: 'Ready',
    },
    {
      id: 'q-12',
      title: 'Business Continuity & Disaster Recovery Audit',
      description:
        'RTO/RPO targets, failover drills, offsite backup verification, and incident management procedures.',
      fileType: 'PDF',
      questionsCount: 30,
      status: 'Ready',
    },
  ])

  // Form states for Upload Popup Modal
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [newQuestionnaireTitle, setNewQuestionnaireTitle] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Add questionnaire: choose between uploading a document or generating with AI
  const [showAddOptions, setShowAddOptions] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiTitle, setAiTitle] = useState('')
  const [aiInstructions, setAiInstructions] = useState('')
  const [aiStage, setAiStage] = useState<'form' | 'thinking' | 'done'>('form')
  const [aiStepsDone, setAiStepsDone] = useState(0)
  const [aiResult, setAiResult] = useState<{
    questionnaire: Questionnaire
    areas: string[]
  } | null>(null)
  const aiTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearAiTimers = () => {
    aiTimers.current.forEach(clearTimeout)
    aiTimers.current = []
  }
  useEffect(() => clearAiTimers, [])
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Filtered Questionnaires (Search & Status Filter)
  const filteredQuestionnaires = useMemo(() => {
    return questionnaires.filter((q) => {
      const matchesStatus = statusFilter === 'all' || q.status === statusFilter
      const query = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !query ||
        q.title.toLowerCase().includes(query) ||
        q.description.toLowerCase().includes(query) ||
        q.fileType.toLowerCase().includes(query) ||
        q.status.toLowerCase().includes(query) ||
        q.questionsCount.toString().includes(query)
      return matchesStatus && matchesSearch
    })
  }, [questionnaires, searchTerm, statusFilter])

  // Pagination math (8 items per page)
  const totalPages = Math.ceil(filteredQuestionnaires.length / ITEMS_PER_PAGE) || 1
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedQuestionnaires = filteredQuestionnaires.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  )

  // Single document file selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 20 * 1024 * 1024) {
        showToast('File size exceeds maximum limit of 20 MB.')
        return
      }
      setUploadedFile(file)
    }
  }

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !uploadedFile) return

    setIsUploading(true)
    setNewQuestionnaireTitle(title.trim())

    setTimeout(() => {
      const rawExtension = uploadedFile.name.split('.').pop()?.toUpperCase()
      const extension = (
        rawExtension === 'XLS' ? 'XLSX' : rawExtension
      ) as Questionnaire['fileType']
      const newQuestionnaire: Questionnaire = {
        id: `q-${Date.now()}`,
        title,
        description:
          description || `Custom vendor compliance checklist parsed from ${uploadedFile.name}.`,
        fileType: extension || 'PDF',
        questionsCount: Math.floor(Math.random() * 20) + 15,
        status: 'Draft',
      }

      setQuestionnaires([newQuestionnaire, ...questionnaires])
      setTitle('')
      setDescription('')
      setUploadedFile(null)
      setIsUploading(false)
      setShowUploadModal(false)
      setNewQuestionnaireTitle('')
      showToast(`Questionnaire "${newQuestionnaire.title}" successfully uploaded & structured!`)
    }, 1500)
  }

  const openAiModal = () => {
    clearAiTimers()
    setAiTitle('')
    setAiInstructions('')
    setAiStage('form')
    setAiStepsDone(0)
    setAiResult(null)
    setShowAddOptions(false)
    setShowAiModal(true)
  }

  const closeAiModal = () => {
    clearAiTimers()
    setShowAiModal(false)
  }

  const aiPlan = generateQuestionnaire(aiTitle, aiInstructions)
  const aiThinkingSteps = [
    'Reading the questionnaire title and instructions',
    `Identifying focus areas: ${aiPlan.areas.join(', ')}`,
    `Drafting ${aiPlan.questions.length} questions`,
    'Writing response cues and evidence requirements',
    'Reviewing coverage and marking required questions',
  ]

  const aiTitleLength = aiTitle.trim().length
  const aiInstructionsLength = aiInstructions.trim().length
  const isAiTitleTooShort = aiTitleLength > 0 && aiTitleLength < AI_TITLE_MIN
  const isAiInstructionsTooShort =
    aiInstructionsLength > 0 && aiInstructionsLength < AI_INSTRUCTIONS_MIN
  const isAiFormValid =
    aiTitleLength >= AI_TITLE_MIN &&
    aiTitleLength <= AI_TITLE_MAX &&
    aiInstructionsLength >= AI_INSTRUCTIONS_MIN &&
    aiInstructionsLength <= AI_INSTRUCTIONS_MAX

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAiFormValid) return
    clearAiTimers()
    setAiStage('thinking')
    setAiStepsDone(0)

    aiThinkingSteps.forEach((_, idx) => {
      aiTimers.current.push(
        setTimeout(() => setAiStepsDone(idx + 1), (idx + 1) * AI_THINKING_STEP_MS)
      )
    })
    aiTimers.current.push(
      setTimeout(
        () => {
          const generated = generateQuestionnaire(aiTitle, aiInstructions)
          const newQuestionnaire: Questionnaire = {
            id: `q-${Date.now()}`,
            title: aiTitle.trim(),
            description: aiInstructions.trim(),
            fileType: 'AI',
            questionsCount: generated.questions.length,
            status: 'Draft',
            questions: generated.questions,
          }
          setQuestionnaires((prev) => [newQuestionnaire, ...prev])
          setAiResult({ questionnaire: newQuestionnaire, areas: generated.areas })
          setAiStage('done')
        },
        (aiThinkingSteps.length + 1) * AI_THINKING_STEP_MS
      )
    )
  }

  const openQuestionnaire = (item: Questionnaire, initialEditMode: boolean) => {
    setSelectedQuestionnaire({
      id: item.id,
      title: item.title,
      status: item.status,
      questionsCount: item.questionsCount,
      initialEditMode,
      initialQuestions: item.questions,
    })
  }

  const handleDelete = () => {
    if (!deletingId) return
    const target = questionnaires.find((q) => q.id === deletingId)
    setQuestionnaires(questionnaires.filter((q) => q.id !== deletingId))
    setDeletingId(null)
    if (target) {
      showToast(`Removed "${target.title}" template.`)
    }
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  // If a row is clicked, open QuestionnaireDetailScreen
  if (selectedQuestionnaire) {
    return (
      <QuestionnaireDetailScreen
        questionnaire={selectedQuestionnaire}
        onBack={() => setSelectedQuestionnaire(null)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full p-4 text-[#0d212c]">
      {/* Toast Notification — subtle light semantic styling */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#f0fdf4] text-[#15803d] px-4 py-3 rounded-xl shadow-md border border-[#bbf7d0] flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <FileText className="w-4 h-4 text-[#16a34a]" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Header */}
      <div className="text-xs font-semibold text-[#64748b] flex items-center gap-1.5">
        <span>M42 admin</span>
        <span>/</span>
        <span className="text-[#36c0c9] font-bold">Questionnaires</span>
      </div>

      {/* Header Bar with Search Bar placed on the LEFT side of Add questionnaire CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xl font-extrabold text-[#0d212c]">Questionnaires</h2>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search questionnaire, description..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#e2e8f0] bg-white text-xs font-medium text-[#0d212c] outline-none focus:border-[#cbd5e1] shadow-xs"
            />
          </div>

          <button
            onClick={() => setShowAddOptions(true)}
            className="bg-[#0d212c] hover:bg-[#122e3d] text-white font-bold py-2.5 px-5 rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer border-0 shrink-0"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Add questionnaire</span>
          </button>
        </div>
      </div>

      {/* Sorting Chips: All, Ready, Draft (UI matching Vendors page) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'all', label: 'All Questionnaires', count: questionnaires.length },
          {
            key: 'Ready',
            label: 'Ready',
            count: questionnaires.filter((q) => q.status === 'Ready').length,
          },
          {
            key: 'Draft',
            label: 'Draft',
            count: questionnaires.filter((q) => q.status === 'Draft').length,
          },
        ].map((chip) => {
          const isSelected = statusFilter === chip.key
          return (
            <button
              key={chip.key}
              onClick={() => {
                setStatusFilter(chip.key as 'all' | 'Ready' | 'Draft')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
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

      {/* Questionnaires Directory Table (Requirement 1: Format column removed) */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs overflow-hidden w-full flex flex-col">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] text-xs font-bold">
                <th className="py-3.5 px-4">Title</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Questions</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]/60">
              {isUploading && (
                <tr className="bg-[#ddf7f9]/30 border-b border-[#36c0c9]/40 animate-pulse">
                  <td className="py-3.5 px-4 font-semibold text-xs text-[#0d212c]">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#36c0c9] shrink-0" />
                      <span className="font-extrabold">
                        {newQuestionnaireTitle || 'New Questionnaire'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ddf7f9] text-[#0f766e] flex items-center gap-1 border border-[#36c0c9]/30">
                        <Loader2 className="w-3 h-3 animate-spin" /> Adding item to list...
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#64748b] text-xs max-w-sm truncate italic">
                    Parsing document and structuring questions...
                  </td>
                  <td className="py-3.5 px-4 text-[#0d212c] font-semibold text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusChip label="Processing..." status="info" dot={false} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Loader2 className="w-4 h-4 animate-spin text-[#36c0c9] ml-auto" />
                  </td>
                </tr>
              )}
              {paginatedQuestionnaires.length === 0 && !isUploading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[#64748b]">
                    No matching questionnaires found.
                  </td>
                </tr>
              )}
              {paginatedQuestionnaires.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => openQuestionnaire(item, false)}
                  className="hover:bg-[#f8fafc] transition cursor-pointer group"
                >
                  <td
                    className="py-3.5 px-4 font-semibold text-xs text-[#0d212c] group-hover:text-[#36c0c9] truncate"
                    title={item.title}
                  >
                    {item.title}
                  </td>
                  <td
                    className="py-3.5 px-4 text-[#64748b] text-xs max-w-sm truncate"
                    title={item.description}
                  >
                    {item.description}
                  </td>
                  <td
                    className="py-3.5 px-4 text-[#0d212c] font-semibold text-xs"
                    title={`${item.questionsCount} questions`}
                  >
                    {item.questionsCount}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusChip
                      label={item.status === 'Draft' ? 'Draft' : 'Ready'}
                      status={item.status === 'Draft' ? 'warning' : 'success'}
                      dot={false}
                    />
                  </td>
                  {/* Requirement 4: Delete icon color is red with hover interaction removed */}
                  <td className="py-3.5 px-4 text-right">
                    <div
                      className="flex items-center justify-end gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => openQuestionnaire(item, true)}
                        className="p-1.5 text-[#64748b] hover:text-[#0d212c] hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="Edit questionnaire"
                        aria-label="Edit questionnaire"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(item.id)}
                        className="p-1.5 text-red-600 cursor-pointer"
                        title="Delete questionnaire"
                        aria-label="Delete questionnaire"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        {filteredQuestionnaires.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#e2e8f0] bg-[#f8fafc]">
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
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-[#36c0c9] text-white'
                        : 'text-[#64748b] hover:bg-slate-200/60'
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

      {/* Add Questionnaire: choose upload or AI generation */}
      {showAddOptions && (
        <div className="fixed inset-0 z-50 bg-[#0d212c]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-[#e2e8f0] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-4 mb-6">
              <div>
                <h3 className="text-lg font-extrabold text-[#0d212c]">Add questionnaire</h3>
                <p className="text-xs text-[#64748b] mt-0.5 font-medium">
                  Choose how you want to create the questionnaire.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddOptions(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-[#0d212c] transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setShowAddOptions(false)
                  setShowUploadModal(true)
                }}
                className="text-left p-6 rounded-2xl border border-[#e2e8f0] hover:border-[#36c0c9] hover:bg-[#ddf7f9]/20 bg-white transition cursor-pointer flex flex-col gap-3"
              >
                <div className="w-11 h-11 rounded-xl bg-[#f1f5f9] flex items-center justify-center">
                  <Upload className="w-5 h-5 text-[#0d212c]" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-extrabold text-[#0d212c]">
                    Upload questionnaire
                  </span>
                  <span className="text-xs text-[#64748b] leading-relaxed">
                    Upload a questionnaire document (PDF, DOCX, MD or Excel) based on the
                    questionnaire template.
                  </span>
                </div>
              </button>

              <button
                onClick={openAiModal}
                className="text-left p-6 rounded-2xl border border-[#e2e8f0] hover:border-[#36c0c9] hover:bg-[#ddf7f9]/20 bg-white transition cursor-pointer flex flex-col gap-3"
              >
                <div className="w-11 h-11 rounded-xl bg-[#ddf7f9] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#0d7280]" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-extrabold text-[#0d212c]">Generate with AI</span>
                  <span className="text-xs text-[#64748b] leading-relaxed">
                    Give a title and instructions, and AI will draft the questions for you to
                    review.
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Questionnaire with AI */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-[#0d212c]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-[#e2e8f0] animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ddf7f9] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#0d7280]" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#0d212c]">
                    Generate questionnaire with AI
                  </h3>
                  <p className="text-xs text-[#64748b] mt-0.5 font-medium">
                    {aiStage === 'form'
                      ? 'Describe the questionnaire you need. You can review and edit the questions afterwards.'
                      : aiStage === 'thinking'
                        ? 'AI is drafting your questionnaire...'
                        : 'Your questionnaire is ready to review.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeAiModal}
                className="p-1 rounded-lg text-slate-400 hover:text-[#0d212c] transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {aiStage === 'form' && (
              <form onSubmit={handleGenerate} className="flex flex-col gap-5">
                <div>
                  <label
                    htmlFor="ai-questionnaire-title"
                    className="block text-xs font-bold text-[#0d212c] mb-2"
                  >
                    Questionnaire title <span className="text-red-500 font-bold">*</span>
                  </label>
                  <Input
                    id="ai-questionnaire-title"
                    placeholder="e.g. Security Risk Assessment"
                    value={aiTitle}
                    onChange={(e) => setAiTitle(e.target.value)}
                    required
                    maxLength={AI_TITLE_MAX}
                    error={isAiTitleTooShort}
                    className="w-full text-xs py-3"
                  />
                  <div
                    className={`flex items-center justify-between gap-3 text-[11px] mt-1.5 ${
                      isAiTitleTooShort ? 'text-red-600 font-semibold' : 'text-[#64748b]'
                    }`}
                  >
                    <span>
                      Minimum {AI_TITLE_MIN} and maximum {AI_TITLE_MAX} characters.
                    </span>
                    <span className="shrink-0">
                      {aiTitle.length}/{AI_TITLE_MAX}
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="ai-questionnaire-instructions"
                    className="block text-xs font-bold text-[#0d212c] mb-2"
                  >
                    Instructions <span className="text-red-500 font-bold">*</span>
                  </label>
                  <Textarea
                    id="ai-questionnaire-instructions"
                    placeholder="e.g. Generate questions for a security risk assessment of a cloud-hosted solution that processes patient data."
                    value={aiInstructions}
                    onChange={(e) => setAiInstructions(e.target.value)}
                    rows={5}
                    required
                    maxLength={AI_INSTRUCTIONS_MAX}
                    error={isAiInstructionsTooShort}
                    className="w-full text-xs"
                  />
                  <div
                    className={`flex items-center justify-between gap-3 text-[11px] mt-1.5 ${
                      isAiInstructionsTooShort ? 'text-red-600 font-semibold' : 'text-[#64748b]'
                    }`}
                  >
                    <span>
                      Minimum {AI_INSTRUCTIONS_MIN} and maximum {AI_INSTRUCTIONS_MAX} characters.
                    </span>
                    <span className="shrink-0">
                      {aiInstructions.length}/{AI_INSTRUCTIONS_MAX}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748b] mt-1.5">
                    Mention the solution, risk areas and any regulations the questions should cover.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeAiModal}
                    className="px-5 py-2.5 rounded-lg border border-[#e2e8f0] text-xs font-semibold text-[#0d212c] hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isAiFormValid}
                    className="bg-[#0d212c] hover:bg-[#122e3d] text-white font-bold py-2.5 px-7 rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition border-0"
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Generate questionnaire</span>
                  </button>
                </div>
              </form>
            )}

            {aiStage === 'thinking' && (
              <div className="flex flex-col gap-5">
                <div className="p-5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0d7280]">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>Thinking...</span>
                  </div>
                  <ol className="flex flex-col gap-3">
                    {aiThinkingSteps.map((step, idx) => {
                      const isDone = idx < aiStepsDone
                      const isActive = idx === aiStepsDone
                      return (
                        <li key={step} className="flex items-center gap-3 text-xs">
                          <span className="w-5 h-5 shrink-0 flex items-center justify-center">
                            {isDone ? (
                              <span className="w-5 h-5 rounded-full bg-[#36c0c9] flex items-center justify-center">
                                <Check className="w-3 h-3 text-white stroke-[3]" />
                              </span>
                            ) : isActive ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#36c0c9]" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-[#cbd5e1]" />
                            )}
                          </span>
                          <span
                            className={
                              isDone
                                ? 'text-[#0d212c] font-medium'
                                : isActive
                                  ? 'text-[#0d212c] font-bold'
                                  : 'text-[#94a3b8]'
                            }
                          >
                            {step}
                          </span>
                        </li>
                      )
                    })}
                  </ol>
                  <div className="h-1.5 w-full bg-[#e2e8f0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#36c0c9] transition-all duration-700"
                      style={{ width: `${(aiStepsDone / aiThinkingSteps.length) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      clearAiTimers()
                      setAiStage('form')
                      setAiStepsDone(0)
                    }}
                    className="px-5 py-2.5 rounded-lg border border-[#e2e8f0] text-xs font-semibold text-[#0d212c] hover:bg-slate-50 cursor-pointer"
                  >
                    Stop generating
                  </button>
                </div>
              </div>
            )}

            {aiStage === 'done' && aiResult && (
              <div className="flex flex-col gap-5">
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0]">
                  <CheckCircle2 className="w-5 h-5 text-[#16a34a] shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-extrabold text-[#0d212c]">
                      {aiResult.questionnaire.questionsCount} questions generated
                    </span>
                    <span className="text-xs text-[#64748b]">
                      &ldquo;{aiResult.questionnaire.title}&rdquo; covers{' '}
                      {aiResult.areas.join(', ')}. It has been added to your questionnaires as a
                      Draft.
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-wider">
                    Preview
                  </span>
                  <ol className="flex flex-col divide-y divide-[#e2e8f0] border border-[#e2e8f0] rounded-2xl">
                    {aiResult.questionnaire.questions?.slice(0, 4).map((q) => (
                      <li key={q.id} className="px-4 py-3 text-xs text-[#0d212c] flex gap-2">
                        <span className="font-bold text-[#64748b]">{q.id}.</span>
                        <span>{q.question}</span>
                      </li>
                    ))}
                  </ol>
                  {aiResult.questionnaire.questionsCount > 4 && (
                    <span className="text-[11px] text-[#64748b]">
                      + {aiResult.questionnaire.questionsCount - 4} more questions
                    </span>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeAiModal}
                    className="px-5 py-2.5 rounded-lg border border-[#e2e8f0] text-xs font-semibold text-[#0d212c] hover:bg-slate-50 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeAiModal()
                      openQuestionnaire(aiResult.questionnaire, true)
                    }}
                    className="bg-[#0d212c] hover:bg-[#122e3d] text-white font-bold py-2.5 px-7 rounded-lg text-xs shadow-xs cursor-pointer transition border-0"
                  >
                    Review questions
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Questionnaire Popup Modal (Requirement 2: Width increased to max-w-3xl) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-[#0d212c]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-8 shadow-2xl border border-[#e2e8f0] animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-4 mb-6">
              <div>
                <h3 className="text-lg font-extrabold text-[#0d212c]">Upload questionnaire</h3>
                <p className="text-xs text-[#64748b] mt-0.5 font-medium">
                  Upload custom compliance checklist document for AI automated parsing.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-[#0d212c] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-[#0d212c] mb-2">
                  Questionnaire title <span className="text-red-500 font-bold">*</span>
                </label>
                <Input
                  placeholder="e.g. Technical Questionnaire"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full text-xs py-3"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0d212c] mb-2">Description</label>
                <Textarea
                  placeholder="Brief summary of what this questionnaire covers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full text-xs"
                />
              </div>

              {/* Requirement 3: Info icon color uses text color (#64748b) */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <label className="block text-xs font-bold text-[#0d212c]">
                    Document upload (PDF, DOCX, MD, Excel - Max 1 file, up to 20 MB){' '}
                    <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="relative group cursor-pointer">
                    <Info className="w-3.5 h-3.5 text-[#64748b]" />
                    <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute left-1/2 -translate-x-1/2 bottom-6 z-50 w-64 bg-[#0d212c] text-white text-xs p-2.5 rounded-xl shadow-xl border border-white/10 text-center">
                      The questionnaire will be created based on the document you will be uploading,
                      which can be edited later on.
                    </div>
                  </div>
                </div>

                {!uploadedFile ? (
                  <label className="border-2 border-dashed border-[#e2e8f0] hover:border-[#cbd5e1] bg-[#f8fafc] hover:bg-[#f1f5f9] rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition text-center min-h-[160px]">
                    <Upload className="w-8 h-8 text-[#0d212c]" />
                    <span className="text-xs font-bold text-[#0d212c]">
                      Click to choose file or drag and drop
                    </span>
                    <span className="text-[11px] text-[#64748b]">
                      Supported formats: PDF, DOCX, MD, XLSX, XLS (Maximum file size: 20 MB)
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.md,.xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                      required
                    />
                  </label>
                ) : (
                  <div className="p-4 rounded-xl border border-[#cbd5e1] bg-[#f8fafc] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-5 h-5 text-[#0d212c] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0d212c] truncate">
                          {uploadedFile.name}
                        </p>
                        <span className="text-[10px] text-[#64748b]">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB (Max 20 MB)
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-600 transition cursor-pointer"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="mt-3 p-3.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex flex-col gap-2">
                  <p className="text-[11px] text-[#64748b] leading-relaxed">
                    <strong>Note:</strong> Please make sure to include all questions in the
                    specified format along with all response details. Below is the reference
                    template which you can download.
                  </p>
                  <button
                    type="button"
                    onClick={() => showToast('Downloading questionnaire reference template...')}
                    className="text-[#36c0c9] hover:text-[#2cb0b9] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer bg-transparent border-0 self-start p-0"
                  >
                    <Download className="w-3.5 h-3.5 text-[#36c0c9]" />
                    <span>Download questionnaire template</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-5 py-2.5 rounded-lg border border-[#e2e8f0] text-xs font-semibold text-[#0d212c] hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !title.trim() || !uploadedFile}
                  className="bg-[#0d212c] hover:bg-[#122e3d] text-white font-bold py-2.5 px-7 rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition border-0"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Adding & structuring...</span>
                    </>
                  ) : (
                    <span>Upload & structure</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Questionnaire Confirmation Modal Popup (Center Aligned) */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-[#0d212c]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 sm:p-10 shadow-2xl border border-[#e2e8f0] animate-in fade-in zoom-in-95 duration-150 text-center flex flex-col items-center gap-4 min-h-[240px] justify-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-2xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#0d212c] mb-1.5">Confirm deletion</h3>
              <p className="text-xs text-[#64748b] leading-relaxed max-w-md">
                Are you sure you want to remove this questionnaire template from your active
                workspace?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 w-full mt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-6 py-3 rounded-lg border border-[#e2e8f0] text-xs font-bold text-[#0d212c] hover:bg-slate-50 cursor-pointer flex-1 bg-transparent transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer flex-1 border-0 transition shadow-2xs"
              >
                Delete template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
