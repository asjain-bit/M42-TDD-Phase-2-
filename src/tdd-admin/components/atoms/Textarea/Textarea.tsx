import React from 'react'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, disabled, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        disabled={disabled}
        className={[
          'w-full rounded-md border bg-white px-3.5 py-2.5 text-xs text-[#0d212c] transition-all outline-none resize-y',
          'placeholder:text-[#94a3b8]',
          'focus:border-[#cbd5e1] focus:ring-1 focus:ring-[#cbd5e1]',
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[#e2e8f0]',
          disabled ? 'bg-[#f8fafc] text-[#94a3b8] cursor-not-allowed opacity-60' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'
