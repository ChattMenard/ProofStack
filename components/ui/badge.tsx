import React from 'react'

type Props = {
  children?: React.ReactNode
  className?: string
}

export default function Badge({ children, className = '' }: Props) {
  return <span className={className}>{children}</span>
}
