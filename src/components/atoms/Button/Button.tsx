import React from 'react'
import type { ButtonProps } from './Button.types'

/**
 * Button — Atom
 * Fundamental interactive push button element.
 * Used in: FormField, SearchBar, Toast, AppDialog, DataTable, SettingsPanel, SiteHeader
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      className = '',
      disabled = false,
      children,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

    const variantClasses = {
      primary:
        'bg-action-primary-bg-default text-action-primary-text hover:bg-action-primary-bg-hover active:bg-action-primary-bg-pressed',
      destructive:
        'bg-action-destructive-bg-default text-action-destructive-text hover:bg-action-destructive-bg-hover',
      outline: 'border border-border-default bg-transparent text-text-primary hover:bg-bg-hover',
      ghost: 'bg-transparent text-text-primary hover:bg-bg-hover',
      soft: 'bg-action-primary-bg-soft text-text-accent hover:bg-bg-hover',
    }[variant]

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
    }[size]

    const widthClass = fullWidth ? 'w-full' : ''

    const combinedClasses =
      `${baseClasses} ${variantClasses} ${sizeClasses} ${widthClass} ${className}`.trim()

    return (
      <button ref={ref} type={type} disabled={disabled} className={combinedClasses} {...rest}>
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
