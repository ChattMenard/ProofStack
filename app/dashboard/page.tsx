import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import supabaseServer from '../../lib/supabaseServer'
import GitHubSync from '../../components/GitHubSync'
import UploadForm from '../../components/UploadForm'
import DataDeletion from '../../components/DataDeletion'

export default async function DashboardPage() {
  const cookieStore = cookies()
  const token = cookieStore.get('sb-access-token')?.value

  if (!token) redirect('/login')

  const { data: userData } = await supabaseServer.auth.getUser(token)
  if (!userData.user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Upload Work Sample</h2>
            <UploadForm />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Sync GitHub Repos</h2>
            <GitHubSync />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Privacy & Data</h2>
          <DataDeletion />
        </div>
      </div>
    </div>
  )
}