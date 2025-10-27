'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { assessmentQuestions } from '@/lib/assessmentQuestions'

// Use centralized question bank
const quizData = assessmentQuestions

export default function AssessmentTakePage() {
  const router = useRouter()
  const params = useParams()
  const assessmentId = (params?.id as string) || ''

  const [quiz, setQuiz] = useState<any>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [startTime, setStartTime] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    // Load quiz data
    const data = quizData[assessmentId]
    if (!data) {
      alert('Assessment not found')
      router.push('/professional/assessments')
      return
    }
    setQuiz(data)
    setTimeLeft(data.durationMinutes * 60)
    setStartTime(Date.now())
    setAnswers(new Array(data.questions.length).fill(-1))
  }, [assessmentId, router])

  useEffect(() => {
    if (timeLeft <= 0 || !quiz) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          submitAssessment()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, quiz])

  function selectAnswer(answerIndex: number) {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answerIndex
    setAnswers(newAnswers)
  }

  function nextQuestion() {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  function previousQuestion() {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  async function submitAssessment() {
    if (submitting) return
    setSubmitting(true)

    try {
      // Calculate score
      let correct = 0
      quiz.questions.forEach((q: any, idx: number) => {
        if (answers[idx] === q.correctAnswer) correct++
      })
      const score = Math.round((correct / quiz.questions.length) * 100)
      const timeTaken = Math.floor((Date.now() - startTime) / 1000)

      const res = await fetch('/api/assessments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentType: quiz.type,
          targetLevel: quiz.targetLevel,
          answers: { questions: quiz.questions, userAnswers: answers },
          score,
          timeTakenSeconds: timeTaken
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Submission failed')
      }

      const data = await res.json()
      setResult(data)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
      setSubmitting(false)
    }
  }

  if (!quiz) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600 mx-auto" />
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    )
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-2xl px-4">
          <div className={`rounded-lg p-8 text-center shadow-lg ${result.passed ? 'bg-green-50' : 'bg-yellow-50'}`}>
            <div className="mb-4 text-6xl">{result.passed ? '🎉' : '📚'}</div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              {result.passed ? 'Assessment Passed!' : 'Keep Practicing!'}
            </h2>
            <p className="mb-6 text-gray-700">{result.message}</p>
            {result.levelChanged && (
              <div className="mb-6 rounded-lg bg-white p-4">
                <p className="mb-2 text-sm font-medium text-gray-600">New Skill Level</p>
                <p className="text-3xl font-bold capitalize text-indigo-600">{result.newLevel}</p>
              </div>
            )}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/professional/assessments')}
                className="rounded-md bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700"
              >
                Back to Assessments
              </button>
              <button
                onClick={() => router.push('/professional/profile')}
                className="rounded-md border border-gray-300 bg-white px-6 py-3 text-gray-700 hover:bg-gray-50"
              >
                View Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const question = quiz.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="mb-2 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
            <div className={`text-lg font-mono font-semibold ${timeLeft < 60 ? 'text-red-600' : 'text-gray-700'}`}>
              ⏱️ {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </p>
        </div>

        {/* Question */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{question.question}</h2>
          <div className="space-y-3">
            {question.options.map((option: string, idx: number) => (
              <button
                key={idx}
                onClick={() => selectAnswer(idx)}
                className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                  answers[currentQuestion] === idx
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium">{String.fromCharCode(65 + idx)}.</span> {option}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={previousQuestion}
            disabled={currentQuestion === 0}
            className="rounded-md border border-gray-300 bg-white px-6 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ← Previous
          </button>
          {currentQuestion === quiz.questions.length - 1 ? (
            <button
              onClick={submitAssessment}
              disabled={submitting || answers.includes(-1)}
              className="rounded-md bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Assessment'}
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="rounded-md bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700"
            >
              Next →
            </button>
          )}
        </div>

        {/* Answer Overview */}
        <div className="mt-6 rounded-lg bg-white p-4 shadow">
          <p className="mb-3 text-sm font-medium text-gray-700">Answer Status:</p>
          <div className="flex flex-wrap gap-2">
            {answers.map((answer, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`h-10 w-10 rounded-lg font-medium transition-all ${
                  idx === currentQuestion
                    ? 'ring-2 ring-indigo-600 ring-offset-2'
                    : ''
                } ${
                  answer >= 0
                    ? 'bg-indigo-600 text-white'
                    : 'border-2 border-gray-300 bg-white text-gray-700 hover:border-indigo-300'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
