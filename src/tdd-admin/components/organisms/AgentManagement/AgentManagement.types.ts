/**
 * AgentManagement — Types
 */

export interface AgentVersionHistoryItem {
  id: string
  version: string
  isActive: boolean
  note: string
  author: string
  date: string
}

export interface AgentConfigField {
  value: string
  defaultValue: string
  isModified?: boolean
}

export interface AgentData {
  id: string
  name: string
  kind: 'Background' | 'Voice'
  version: string
  status: 'default' | 'Modified'
  prompt: string
  config: {
    defaultVoice?: AgentConfigField
    modelDeployment?: AgentConfigField
    temperature?: AgentConfigField
    realtimeModelDeployment?: AgentConfigField
    speakingSpeed?: AgentConfigField
    turnDetection?: AgentConfigField
    responseEagerness?: AgentConfigField
    inputNoiseReduction?: AgentConfigField
    uploadWaitBeforeReminder?: AgentConfigField
  }
  versionHistory: AgentVersionHistoryItem[]
}

export interface AgentManagementProps {
  className?: string
  initialAgentId?: string
  /** The prototype switch between the Admin and Evaluator views; off for the Partnership Admin */
  showRoleSwitch?: boolean
}
