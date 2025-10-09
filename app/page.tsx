"use client"
import AuthForm from '../components/AuthForm'
import UserProfile from '../components/UserProfile'

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-medium">Sign in</h2>
          <AuthForm />
        </div>
        <div>
          <UserProfile />
        </div>
      </div>

      <section>
        <h2 className="text-lg font-medium">Demo upload</h2>
        <p className="text-sm text-gray-600">Upload a sample to see analysis appear on your profile (demo flow).</p>
        <div className="mt-4">(Upload UI coming next)</div>
      </section>
    </div>
  )
}
