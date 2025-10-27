'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AdminSecurityPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || user.email !== 'mattchenard2009@gmail.com') {
      router.push('/')
      return
    }

    setIsAdmin(true)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-secondary">Loading...</div>
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-primary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">🔐 Security Dashboard</h1>
          <p className="text-secondary mt-2">Monitor security events and audit logs</p>
        </div>

        {/* Security Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-secondary border border-default rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary">Active Sessions</p>
                <p className="text-2xl font-bold text-primary mt-1">--</p>
              </div>
              <div className="text-4xl">👤</div>
            </div>
          </div>

          <div className="bg-secondary border border-default rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary">Failed Logins (24h)</p>
                <p className="text-2xl font-bold text-primary mt-1">--</p>
              </div>
              <div className="text-4xl">⚠️</div>
            </div>
          </div>

          <div className="bg-secondary border border-default rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary">API Rate Limits Hit</p>
                <p className="text-2xl font-bold text-primary mt-1">--</p>
              </div>
              <div className="text-4xl">🚦</div>
            </div>
          </div>
        </div>

        {/* Audit Log */}
        <div className="bg-secondary border border-default rounded-lg p-6">
          <h2 className="text-xl font-bold text-primary mb-4">Recent Security Events</h2>
          <div className="text-center text-secondary py-12">
            <p className="text-lg mb-2">Security audit logging system</p>
            <p className="text-sm">This page tracks authentication attempts, suspicious activity, and system access logs.</p>
            <p className="text-sm mt-4 text-accent">Implementation coming soon</p>
          </div>
        </div>

        {/* Security Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-secondary border border-default rounded-lg p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-primary border border-default rounded-lg hover:border-accent transition-colors">
                <div className="font-medium text-primary">🔒 Review RLS Policies</div>
                <div className="text-sm text-secondary">Check database security rules</div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-primary border border-default rounded-lg hover:border-accent transition-colors">
                <div className="font-medium text-primary">🔑 Rotate API Keys</div>
                <div className="text-sm text-secondary">Regenerate service credentials</div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-primary border border-default rounded-lg hover:border-accent transition-colors">
                <div className="font-medium text-primary">📊 Export Audit Log</div>
                <div className="text-sm text-secondary">Download security report</div>
              </button>
            </div>
          </div>

          <div className="bg-secondary border border-default rounded-lg p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">Security Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-secondary">Database RLS</span>
                <span className="text-green-600 font-semibold">✓ Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary">Rate Limiting</span>
                <span className="text-green-600 font-semibold">✓ Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary">Secret Scanning</span>
                <span className="text-green-600 font-semibold">✓ Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary">Audit Logging</span>
                <span className="text-yellow-600 font-semibold">⚠ Partial</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
