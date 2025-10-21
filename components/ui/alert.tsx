import React from 'react'

type Props = {
  children?: React.ReactNode
  variant?: 'info' | 'error' | 'success'
  className?: string
}

export default function Alert({ children, variant = 'info', className = '' }: Props) {
  return <div className={`${className}`} role="alert">{children}</div>
}
