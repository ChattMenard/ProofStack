import React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode
  className?: string
}

export default function Button({ children, className = '', ...rest }: Props) {
  return (
    <button className={className} {...rest}>
      {children}
    </button>
  )
}
