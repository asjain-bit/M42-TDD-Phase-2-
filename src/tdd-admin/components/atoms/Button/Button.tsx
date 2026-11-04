/**
 * Button — Atom
 * Reusable button component matching SOW Generator & Governance App design guidelines.
 */

import React from 'react'
import { ButtonProps } from './Button.types'

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, disabled, ...props }, ref) => {
    const baseStyle =
      'inline-flex items-center justify-center font-semibold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#cbd5e1] disabled:pointer-events-none disabled:opacity-50 cursor-pointer rounded-lg select-none'

    const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
      primary: 'bg-[#0d212c] text-white hover:bg-[#122e3d] active:bg-[#08171f] shadow-xs font-bold',
      secondary:
        'bg-white text-[#0d212c] border border-[#e2e8f0] hover:bg-[#f1f5f9] active:bg-[#e2e8f0] shadow-xs font-semibold',
      accent: 'bg-[#0d212c] text-white hover:bg-[#122e3d] active:bg-[#08171f] shadow-xs font-bold',
      ghost: 'bg-transparent text-[#0d212c] hover:bg-[#f1f5f9] active:bg-[#e2e8f0]',
      outline: 'bg-transparent text-[#0d212c] border border-[#e2e8f0] hover:bg-[#f1f5f9]',
      destructive: 'bg-[#d92d20] text-white hover:bg-[#b42318] active:bg-[#91180f] shadow-xs',
    }

    const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-11 px-5 text-sm gap-2.5',
    }

    const combinedClassName = [baseStyle, variantStyles[variant], sizeStyles[size], className]
      .filter(Boolean)
      .join(' ')

    return (
      <button ref={ref} className={combinedClassName} disabled={disabled} {...props}>
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
