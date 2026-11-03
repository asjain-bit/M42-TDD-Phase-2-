import type { CustomKpi, KpiValues } from '@/lib/customKpi'

export interface CreateKpiModalProps {
  /** Editing an existing KPI; empty to create one */
  initial?: CustomKpi
  /** The selected week's figures, for the live preview */
  values: KpiValues
  /** e.g. Oct 12 – 18, 2026 */
  weekLabel: string
  onSave: (kpi: CustomKpi) => void
  onClose: () => void
}
