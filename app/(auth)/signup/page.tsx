import AuthForm from '../../../components/AuthForm'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-forest-950">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-forest-50">
            Create ProofStack Account
          </h2>
          <p className="mt-2 text-center text-sm text-forest-300">
            Build your verified skills portfolio
          </p>
        </div>
        <AuthForm />
      </div>
    </div>
  )
}