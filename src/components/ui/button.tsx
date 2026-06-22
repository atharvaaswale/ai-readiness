// ------------------------------------------------------------------
// Button (UI Primitive)
//
// Purpose:
//   Styled button with variant and loading state support.
//
// Responsibility:
//   Renders a <button> with:
//   - variant: 'primary' (brand blue) or 'secondary' (outlined gray)
//   - loading: shows a CSS spinner and disables click
//   - disabled: grayed out
//
// Dependencies:
//   - None (self-contained)
// ------------------------------------------------------------------

'use client'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClass =
    'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed'

  const variants = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300',
    secondary:
      'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-400 disabled:text-gray-400',
  }

  return (
    <button
      className={`${baseClass} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
