'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export default function Navigation() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    const path = pathname ?? '/'
    if (href === '/' && path === '/') return true
    if (href !== '/' && path.startsWith(href)) return true
    return false
  }

  return (
    <nav className="hidden md:flex items-center gap-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`text-sm font-medium transition-colors ${
            isActive(item.href)
              ? 'text-sage-400 dark:text-sage-300 border-b-2 border-sage-400 dark:border-sage-300'
              : 'text-gray-600 dark:text-gray-400 hover:text-sage-400 dark:hover:text-sage-300'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
