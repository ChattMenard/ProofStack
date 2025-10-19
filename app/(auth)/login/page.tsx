import AuthForm from '../../../components/AuthForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-forest-950">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-forest-50">
            Sign in to ProofStack
          </h2>
        </div>
        <AuthForm />
      </div>
    </div>
  )
}