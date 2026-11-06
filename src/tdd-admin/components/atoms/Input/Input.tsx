import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, leftIcon, rightIcon, disabled, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3 flex items-center justify-center text-[#64748b] pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={[
            'w-full rounded-md border bg-white px-3.5 py-2.5 text-xs text-[#0d212c] transition-all outline-none',
            'placeholder:text-[#94a3b8]',
            'focus:border-[#cbd5e1] focus:ring-1 focus:ring-[#cbd5e1]',
            error
              ? 'border-[#d92d20] focus:border-[#d92d20] focus:ring-[#d92d20]'
              : 'border-[#e2e8f0]',
            disabled ? 'bg-[#f8fafc] text-[#94a3b8] cursor-not-allowed opacity-60' : '',
            leftIcon ? 'pl-9' : '',
            rightIcon ? 'pr-9' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 flex items-center justify-center text-[#64748b]">
            {rightIcon}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
