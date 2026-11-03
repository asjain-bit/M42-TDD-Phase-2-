'use client'

/**
 * CreateKpiModal — Organism
 * Popup to create or edit a custom KPI: a name, a unit and 2-5 inputs joined by + − × ÷ (worked
 * out left to right), with a live preview for the selected week.
 * Used in: UsageInsightsScreen
 */

import React, { useState } from 'react'
import { ChevronDown, Plus, X } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { AppDialog } from '@/components/molecules/AppDialog'
import {
  KPI_OPERATORS,
  KPI_SOURCES,
  KPI_UNITS,
  MAX_KPI_INPUTS,
  MIN_KPI_INPUTS,
  describeCustomKpi,
  evaluateCustomKpi,
  formatKpiValue,
  type KpiOperand,
  type KpiOperator,
  type KpiSource,
  type KpiUnit,
} from '@/lib/customKpi'
import type { CreateKpiModalProps } from './CreateKpiModal.types'

/** Own values are typed as text so a field can be emptied while editing */
type DraftOperand =
  { kind: 'system'; source: KpiSource } | { kind: 'custom'; value: string; label: string }

const toDraft = (o: KpiOperand): DraftOperand =>
  o.kind === 'system' ? o : { kind: 'custom', value: String(o.value), label: o.label }

const fromDraft = (o: DraftOperand): KpiOperand =>
  o.kind === 'system'
    ? o
    : { kind: 'custom', value: o.value.trim() === '' ? NaN : Number(o.value), label: o.label }

const UNIT_LABEL: Record<KpiUnit, string> = {
  number: 'Number',
  $: '$ (US dollars)',
  '%': '% (percent)',
  hours: 'Hours',
  x: 'x (times)',
}

/**
 * The shared Select with this popup's look: 40px tall, the native arrow replaced by a 16px
 * chevron 12px from the right, and the same right padding on every select
 */
const KpiSelect: React.FC<React.ComponentProps<typeof Select> & { wrapperClassName?: string }> = ({
  wrapperClassName = '',
  className = '',
  ...props
}) => (
  <div className={`relative ${wrapperClassName}`.trim()}>
    <Select {...props} className={`h-10 !py-0 !pr-8 appearance-none ${className}`.trim()} />
    <ChevronDown
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary"
      strokeWidth={2}
      aria-hidden="true"
    />
  </div>
)

/** Operator column (56px) · input · remove button column (32px) */
const ROW = 'grid grid-cols-[56px_minmax(0,1fr)_32px] gap-2 items-center'

export const CreateKpiModal: React.FC<CreateKpiModalProps> = ({
  initial,
  values,
  weekLabel,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(initial?.name ?? '')
  const [unit, setUnit] = useState<KpiUnit>(initial?.unit ?? 'number')
  const [operands, setOperands] = useState<DraftOperand[]>(
    initial?.operands.map(toDraft) ?? [
      { kind: 'system', source: 'savings' },
      { kind: 'system', source: 'outputs' },
    ]
  )
  const [operators, setOperators] = useState<KpiOperator[]>(initial?.operators ?? ['÷'])

  const formula = { operands: operands.map(fromDraft), operators }
  const result = evaluateCustomKpi(formula, values)
  const canSave = name.trim() !== '' && 'value' in result

  const setOperand = (i: number, next: DraftOperand) =>
    setOperands((prev) => prev.map((o, j) => (j === i ? next : o)))

  const pick = (i: number, choice: string) =>
    setOperand(
      i,
      choice === 'custom'
        ? { kind: 'custom', value: '', label: '' }
        : { kind: 'system', source: choice as KpiSource }
    )

  const addInput = () => {
    setOperands((prev) => [...prev, { kind: 'system', source: 'outputs' }])
    setOperators((prev) => [...prev, '+'])
  }

  const removeInput = (i: number) => {
    setOperands((prev) => prev.filter((_, j) => j !== i))
    // The operator before a removed input goes with it (the first input has none)
    setOperators((prev) => prev.filter((_, j) => j !== Math.max(0, i - 1)))
  }

  const save = () =>
    onSave({
      id: initial?.id ?? `kpi-${Date.now()}`,
      name: name.trim(),
      unit,
      operands: formula.operands,
      operators,
    })

  return (
    <AppDialog
      isOpen
      title={initial ? 'Edit KPI' : 'Create KPI'}
      description="Combine figures the system already has with your own values."
      onClose={onClose}
      actions={
        <>
          <Button variant="outline" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={save} disabled={!canSave}>
            Save KPI
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_10rem] gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="kpi-name" className="text-xs font-semibold text-text-secondary">
              KPI name <span className="text-text-error">*</span>
            </label>
            <Input
              id="kpi-name"
              className="h-10"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Savings per assessment"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="kpi-unit" className="text-xs font-semibold text-text-secondary">
              Unit
            </label>
            <KpiSelect
              id="kpi-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value as KpiUnit)}
              options={KPI_UNITS.map((u) => ({ value: u, label: UNIT_LABEL[u] }))}
            />
          </div>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-xs font-semibold text-text-secondary mb-1">
            How it&apos;s calculated
          </legend>
          <ol className="flex flex-col gap-2">
            {operands.map((o, i) => (
              <li key={i} className="flex flex-col gap-2">
                <div className={ROW}>
                  {i === 0 ? (
                    <span aria-hidden="true" />
                  ) : (
                    <KpiSelect
                      aria-label={`Operator before input ${i + 1}`}
                      value={operators[i - 1]}
                      onChange={(e) =>
                        setOperators((prev) =>
                          prev.map((op, j) => (j === i - 1 ? (e.target.value as KpiOperator) : op))
                        )
                      }
                      className="!pl-2.5"
                      options={KPI_OPERATORS.map((op) => ({ value: op, label: op }))}
                    />
                  )}
                  <KpiSelect
                    aria-label={`Input ${i + 1}`}
                    value={o.kind === 'system' ? o.source : 'custom'}
                    onChange={(e) => pick(i, e.target.value)}
                    wrapperClassName="min-w-0"
                  >
                    <optgroup label="From the system">
                      {KPI_SOURCES.map((src) => (
                        <option key={src.id} value={src.id}>
                          {src.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Your own">
                      <option value="custom">Enter a value</option>
                    </optgroup>
                  </KpiSelect>
                  {i === 0 ? (
                    <span aria-hidden="true" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeInput(i)}
                      disabled={operands.length <= MIN_KPI_INPUTS}
                      aria-label={`Remove input ${i + 1}`}
                      title={
                        operands.length <= MIN_KPI_INPUTS
                          ? `A KPI needs at least ${MIN_KPI_INPUTS} inputs`
                          : 'Remove input'
                      }
                      className="h-8 w-8 rounded-md text-text-tertiary hover:text-text-error hover:bg-bg-hover disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-tertiary inline-flex items-center justify-center cursor-pointer transition"
                    >
                      <X className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                    </button>
                  )}
                </div>
                {o.kind === 'custom' && (
                  <div className={ROW}>
                    <span aria-hidden="true" />
                    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-2">
                      <Input
                        aria-label={`Value for input ${i + 1}`}
                        type="number"
                        className="h-10"
                        value={o.value}
                        onChange={(e) => setOperand(i, { ...o, value: e.target.value })}
                        placeholder="Value"
                      />
                      <Input
                        aria-label={`Label for input ${i + 1}`}
                        className="h-10"
                        value={o.label}
                        onChange={(e) => setOperand(i, { ...o, label: e.target.value })}
                        placeholder="Label, e.g. Analysts"
                      />
                    </div>
                    <span aria-hidden="true" />
                  </div>
                )}
              </li>
            ))}
          </ol>
          {operands.length < MAX_KPI_INPUTS && (
            <button
              type="button"
              onClick={addInput}
              className="self-start inline-flex items-center gap-1 text-xs font-medium text-text-link hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
              Add input
            </button>
          )}
          <span className="text-[11px] text-text-tertiary">
            Worked out left to right, in the order shown.
          </span>
        </fieldset>

        <div
          role="status"
          className="rounded-lg border border-border-subtle bg-bg-surface-1 px-4 py-3 flex flex-col gap-1"
        >
          <span className="text-[11px] font-medium text-text-tertiary">Preview · {weekLabel}</span>
          {'value' in result ? (
            <span className="text-2xl font-semibold text-text-primary">
              {formatKpiValue(result.value, unit)}
            </span>
          ) : (
            <span className="text-sm font-medium text-text-error">{result.error}</span>
          )}
          <span className="text-xs text-text-secondary">{describeCustomKpi(formula)}</span>
        </div>
      </div>
    </AppDialog>
  )
}
