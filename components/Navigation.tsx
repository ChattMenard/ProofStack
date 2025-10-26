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
    if (href === '/' && pathname === '/') return true
    if (href !== '/' && pathname.startsWith(href)) return true
    return false
  }

  return (
    <nav className="hidden md:flex items-center gap-6">
      <Link 
        href="/employer/signup" 
        className="text-sm font-bold text-sage-400 dark:text-sage-300 hover:text-sage-300 dark:hover:text-sage-200 transition-colors border border-sage-500/30 dark:border-sage-400/30 px-3 py-1.5 rounded-lg hover:border-sage-400/50 dark:hover:border-sage-300/50"
      >
        🏢 For Employers
      </Link>
      
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
