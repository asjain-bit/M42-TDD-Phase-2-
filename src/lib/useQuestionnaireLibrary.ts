import { useSyncExternalStore } from 'react'
import { getLibrary, subscribeLibrary } from '@/types/questionnaires'

/** The questionnaires the Director can send, kept up to date as they are added or edited */
export const useQuestionnaireLibrary = () =>
  useSyncExternalStore(subscribeLibrary, getLibrary, getLibrary)
