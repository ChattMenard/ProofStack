/**
 * A/B Test Dashboard Component
 * 
 * Allows admins to create, manage, and analyze model A/B tests
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { 
  compareVariants, 
  getABTestMetrics, 
  createABTest, 
  deactivateABTest,
  type ABTestConfig,
  type ABTestMetrics,
  type ModelVariant,
  type Operation,
  MODEL_CONFIGS
} from '@/lib/modelABTesting'

interface ABTest {
  id: string
  name: string
  operation: Operation
  variants: {
    control: ModelVariant
    treatment: ModelVariant
  }
  traffic_split: number
  start_date: string
  end_date?: string
  is_active: boolean
  created_at: string
}

export default function ABTestDashboard() {
  const [tests, setTests] = useState<ABTest[]>([])
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null)
  const [metrics, setMetrics] = useState<{ control: ABTestMetrics; treatment: ABTestMetrics } | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadTests()
  }, [])

  async function loadTests() {
    setLoading(true)
    const { data, error } = await supabase
      .from('ab_tests')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setTests(data)
    }
    setLoading(false)
  }

  async function loadMetrics(testId: string) {
    try {
      const testMetrics = await getABTestMetrics(testId)
      setMetrics(testMetrics)
    } catch (error) {
      console.error('Failed to load metrics:', error)
    }
  }

  async function handleCreateTest(config: ABTestConfig) {
    try {
      await createABTest(config)
      await loadTests()
      setShowCreateForm(false)
    } catch (error) {
      console.error('Failed to create test:', error)
      alert('Failed to create A/B test')
    }
  }

  async function handleDeactivateTest(testId: string) {
    if (!confirm('Are you sure you want to deactivate this test?')) return
    
    try {
      await deactivateABTest(testId)
      await loadTests()
    } catch (error) {
      console.error('Failed to deactivate test:', error)
      alert('Failed to deactivate test')
    }
  }

  function selectTest(test: ABTest) {
    setSelectedTest(test)
    loadMetrics(test.id)
  }

  if (loading) {
    return <div className="p-8">Loading A/B tests...</div>
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Model A/B Testing</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create New Test
        </button>
      </div>

      {showCreateForm && (
        <CreateTestForm
          onSubmit={handleCreateTest}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tests List */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Active Tests</h2>
          <div className="space-y-2">
            {tests.filter(t => t.is_active).map(test => (
              <TestCard
                key={test.id}
                test={test}
                onSelect={() => selectTest(test)}
                onDeactivate={() => handleDeactivateTest(test.id)}
                isSelected={selectedTest?.id === test.id}
              />
            ))}
          </div>

          <h2 className="text-xl font-semibold mt-8 mb-4">Completed Tests</h2>
          <div className="space-y-2">
            {tests.filter(t => !t.is_active).map(test => (
              <TestCard
                key={test.id}
                test={test}
                onSelect={() => selectTest(test)}
                isSelected={selectedTest?.id === test.id}
              />
            ))}
          </div>
        </div>

        {/* Test Details & Results */}
        <div className="lg:col-span-2">
          {selectedTest && metrics ? (
            <TestResults test={selectedTest} metrics={metrics} />
          ) : (
            <div className="text-center text-gray-500 mt-20">
              Select a test to view results
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TestCard({ 
  test, 
  onSelect, 
  onDeactivate, 
  isSelected 
}: { 
  test: ABTest
  onSelect: () => void
  onDeactivate?: () => void
  isSelected: boolean
}) {
  return (
    <div
      className={`p-4 border rounded cursor-pointer transition ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{test.name}</h3>
          <p className="text-sm text-gray-600">{test.operation}</p>
          <div className="text-xs text-gray-500 mt-2">
            <div>Control: {test.variants.control}</div>
            <div>Treatment: {test.variants.treatment}</div>
            <div>Split: {test.traffic_split}% treatment</div>
          </div>
        </div>
        {test.is_active && onDeactivate && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDeactivate()
            }}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Stop
          </button>
        )}
      </div>
      <div className={`text-xs mt-2 ${test.is_active ? 'text-green-600' : 'text-gray-500'}`}>
        {test.is_active ? '● Active' : '○ Inactive'}
      </div>
    </div>
  )
}

function TestResults({ 
  test, 
  metrics 
}: { 
  test: ABTest
  metrics: { control: ABTestMetrics; treatment: ABTestMetrics }
}) {
  const comparison = compareVariants(metrics.control, metrics.treatment)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{test.name}</h2>
        <p className="text-gray-600">{test.operation}</p>
      </div>

      {/* Winner Banner */}
      {comparison.winner !== 'no-difference' && (
        <div className={`p-4 rounded ${
          comparison.winner === 'treatment' ? 'bg-green-100 border-green-500' : 'bg-yellow-100 border-yellow-500'
        } border`}>
          <div className="font-semibold">
            {comparison.winner === 'treatment' ? '🎉 Treatment Wins!' : '⚠️ Control Wins'}
          </div>
          <p className="text-sm mt-1">{comparison.recommendation}</p>
        </div>
      )}

      {/* Metrics Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <MetricsPanel variant="Control" model={test.variants.control} metrics={metrics.control} />
        <MetricsPanel variant="Treatment" model={test.variants.treatment} metrics={metrics.treatment} />
      </div>

      {/* Detailed Comparison */}
      <div className="bg-gray-50 p-4 rounded">
        <h3 className="font-semibold mb-4">Comparison Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Cost Savings:</span>
            <span className={comparison.costSavings > 0 ? 'text-green-600' : 'text-red-600'}>
              {comparison.costSavings > 0 ? '↓' : '↑'} {Math.abs(comparison.costSavings).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Latency Improvement:</span>
            <span className={comparison.latencyImprovement > 0 ? 'text-green-600' : 'text-red-600'}>
              {comparison.latencyImprovement > 0 ? '↓' : '↑'} {Math.abs(comparison.latencyImprovement).toFixed(1)}%
            </span>
          </div>
          {comparison.qualityDifference !== undefined && (
            <div className="flex justify-between">
              <span>Quality Difference:</span>
              <span className={comparison.qualityDifference > 0 ? 'text-green-600' : 'text-red-600'}>
                {comparison.qualityDifference > 0 ? '↑' : '↓'} {Math.abs(comparison.qualityDifference).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetricsPanel({ 
  variant, 
  model, 
  metrics 
}: { 
  variant: string
  model: string
  metrics: ABTestMetrics
}) {
  return (
    <div className="bg-white p-4 rounded border">
      <h3 className="font-semibold mb-3">{variant}</h3>
      <div className="text-sm text-gray-600 mb-4">{model}</div>
      <div className="space-y-3">
        <Metric label="Samples" value={metrics.sampleCount.toString()} />
        <Metric label="Avg Cost" value={`$${metrics.avgCost.toFixed(4)}`} />
        <Metric label="Avg Latency" value={`${metrics.avgLatencyMs.toFixed(0)}ms`} />
        {metrics.avgQualityScore && (
          <Metric label="Quality Score" value={`${metrics.avgQualityScore.toFixed(1)}/100`} />
        )}
        <Metric 
          label="Error Rate" 
          value={`${(metrics.errorRate * 100).toFixed(2)}%`}
          isError={metrics.errorRate > 0.05}
        />
      </div>
    </div>
  )
}

function Metric({ label, value, isError }: { label: string; value: string; isError?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}:</span>
      <span className={`font-semibold ${isError ? 'text-red-600' : ''}`}>{value}</span>
    </div>
  )
}

function CreateTestForm({ 
  onSubmit, 
  onCancel 
}: { 
  onSubmit: (config: ABTestConfig) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [operation, setOperation] = useState<Operation>('skill-extraction')
  const [controlModel, setControlModel] = useState<ModelVariant>('claude-sonnet')
  const [treatmentModel, setTreatmentModel] = useState<ModelVariant>('claude-haiku')
  const [trafficSplit, setTrafficSplit] = useState(50)

  const modelOptions: ModelVariant[] = Object.keys(MODEL_CONFIGS) as ModelVariant[]

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const config: ABTestConfig = {
      name,
      operation,
      variants: {
        control: controlModel,
        treatment: treatmentModel,
      },
      trafficSplit,
      startDate: new Date(),
      isActive: true,
    }

    onSubmit(config)
  }

  return (
    <div className="bg-white p-6 rounded border mb-6">
      <h2 className="text-xl font-semibold mb-4">Create New A/B Test</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Test Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g., Skill Extraction: Sonnet vs Haiku"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Operation</label>
          <select
            value={operation}
            onChange={(e) => setOperation(e.target.value as Operation)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="skill-extraction">Skill Extraction</option>
            <option value="code-analysis">Code Analysis</option>
            <option value="transcription">Transcription</option>
            <option value="summarization">Summarization</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Control Model</label>
            <select
              value={controlModel}
              onChange={(e) => setControlModel(e.target.value as ModelVariant)}
              className="w-full border rounded px-3 py-2"
            >
              {modelOptions.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Treatment Model</label>
            <select
              value={treatmentModel}
              onChange={(e) => setTreatmentModel(e.target.value as ModelVariant)}
              className="w-full border rounded px-3 py-2"
            >
              {modelOptions.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Traffic Split to Treatment: {trafficSplit}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={trafficSplit}
            onChange={(e) => setTrafficSplit(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0% (All Control)</span>
            <span>50% (Equal Split)</span>
            <span>100% (All Treatment)</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Test
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
