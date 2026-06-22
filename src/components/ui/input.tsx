// ------------------------------------------------------------------
// Input (UI Primitive)
//
// Purpose:
//   Styled text input with label and error state.
//
// Responsibility:
//   Renders a <label> + <input> pair. Shows error message and red
//   border when error prop is set.
//
// Dependencies:
//   - None (self-contained)
// ------------------------------------------------------------------

'use client'

import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, className = '', ...props }, ref) {
    return (
      <div>
        {label && (
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full rounded-lg border px-4 py-2 text-gray-900 outline-none transition-colors ${
            error
              ? 'border-red-500 focus:ring-2 focus:ring-red-200'
              : 'border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500'
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    )
  }
)
