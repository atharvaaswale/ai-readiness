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
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full rounded-lg border px-4 py-2 text-gray-900 outline-none transition-colors placeholder:text-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 ${
            error
              ? 'border-red-500 focus:ring-2 focus:ring-red-200 dark:border-red-700 dark:focus:ring-red-800'
              : 'border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:border-gray-600 dark:focus:ring-blue-800 dark:focus:border-blue-400'
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    )
  }
)
