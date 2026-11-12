import type { QuestionnaireQuestion } from './partnership.types'

export interface QuestionnaireTemplate {
  id: string
  name: string
  /** The heading reviewers see on the questionnaire; the name is how the Director finds it */
  title?: string
  questions: QuestionnaireQuestion[]
}

export const QUESTIONNAIRE_LIBRARY: QuestionnaireTemplate[] = [
  {
    id: 'internal-evaluation',
    name: 'Internal Evaluation Questionnaire',
    questions: [
      {
        id: 'q1',
        text: 'Is this a real problem for you today, and what do you do about it now?',
        cue: 'Describe the current clinical or operational problem and existing workarounds.',
        mandatory: true,
      },
      {
        id: 'q2',
        text: 'Which KPI would move, what is the baseline today, and what change would matter?',
        cue: 'Name the KPI, today’s baseline and the change that would matter.',
        mandatory: true,
      },
      {
        id: 'q3',
        text: 'Would you sponsor a pilot, who would the named sponsor be, and what capacity can you commit?',
        cue: 'Say yes or no, name the sponsor and the capacity you can commit.',
        mandatory: true,
      },
      {
        id: 'q4',
        text: 'Is there a budget line, or would it need central funding?',
        cue: 'State whether an existing budget line covers it.',
        mandatory: true,
      },
      {
        id: 'q5',
        text: 'What would make you say no?',
        cue: 'Identify dealbreakers, clinical blockers, integration risks or IT hurdles.',
        mandatory: true,
      },
    ],
  },
  {
    id: 'technical',
    name: 'Technical Questionnaire',
    questions: [
      {
        id: 'tq1',
        text: 'Describe the primary clinical or operational use cases supported by your solution.',
        cue: 'Specify whether workflows are clinical, decision-support, operational, or administrative. State whether outputs influence patient care directly or indirectly.',
        mandatory: true,
      },
      {
        id: 'tq2',
        text: 'Has your organization performed a patient safety or clinical risk assessment for this product?',
        cue: 'Provide documentation or summary of hazard analysis, risk register, or failure-mode analysis related to patient harm.',
        mandatory: true,
      },
      {
        id: 'tq3',
        text: 'Describe how customer data is encrypted in transit and at rest across cloud tenants.',
        cue: 'Specify encryption standards, key management, and tenant isolation controls.',
        mandatory: true,
      },
    ],
  },
  {
    id: 'clinical-safety',
    name: 'Clinical and Safety Questionnaire',
    questions: [
      {
        id: 'cq1',
        text: 'Which clinical teams would use this solution, and how would it fit their daily workflow?',
        cue: 'Name the teams and describe the steps where the solution is used.',
        mandatory: true,
      },
      {
        id: 'cq2',
        text: 'What clinical risks do you see, and how would they be monitored?',
        cue: 'List the risks, who owns them and how an incident would be escalated.',
        mandatory: true,
      },
    ],
  },
]

export const DEFAULT_QUESTIONNAIRE_ID = 'internal-evaluation'

/**
 * The questionnaires the Director can send: the built-in ones plus any added or edited from the
 * Internal Canvas. Kept for the session; components follow it with useQuestionnaireLibrary.
 */
const BUILT_IN = QUESTIONNAIRE_LIBRARY
let library: QuestionnaireTemplate[] = BUILT_IN.map((q) => ({
  ...q,
  questions: q.questions.map((x) => ({ ...x })),
}))
const listeners = new Set<() => void>()
const publish = (next: QuestionnaireTemplate[]) => {
  library = next
  listeners.forEach((l) => l())
}

export const getLibrary = () => library
export const subscribeLibrary = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
export const resetLibrary = () =>
  publish(BUILT_IN.map((q) => ({ ...q, questions: q.questions.map((x) => ({ ...x })) })))

export interface QuestionnaireDraft {
  name: string
  title: string
  questions: QuestionnaireQuestion[]
}

export const addQuestionnaire = (draft: QuestionnaireDraft): string => {
  const id = `custom-q-${Date.now().toString(36)}-${library.length}`
  publish([...library, { id, ...draft }])
  return id
}

export const updateQuestionnaire = (id: string, draft: QuestionnaireDraft) =>
  publish(library.map((q) => (q.id === id ? { ...q, ...draft } : q)))

/** Removes a questionnaire; the last one cannot be deleted */
export const deleteQuestionnaire = (id: string) => {
  if (library.length <= 1) return
  publish(library.filter((q) => q.id !== id))
}

export const getQuestionnaire = (id: string) => library.find((q) => q.id === id) ?? library[0]

/** Copies a template's questions so edits never change the library */
export const cloneQuestions = (questions: QuestionnaireQuestion[]): QuestionnaireQuestion[] =>
  questions.map((q) => ({ ...q }))

let questionCounter = 0
export const newQuestionId = () => `custom-${Date.now()}-${(questionCounter += 1)}`
