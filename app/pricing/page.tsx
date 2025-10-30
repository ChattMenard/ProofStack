'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleGetStarted = async (plan: 'starter' | 'professional' | 'enterprise') => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    setLoading(plan)
    
    // Route to appropriate checkout or contact page
    if (plan === 'enterprise') {
      router.push('/contact?plan=enterprise')
    } else {
      const params = new URLSearchParams({ plan })
      router.push(`/checkout?${params.toString()}`)
    }
  }

  return (
    <div className="min-h-screen bg-forest-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sage-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-earth-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-forest-50 mb-6">
            Employer Subscription Plans
          </h1>
          <p className="text-xl text-forest-300 max-w-3xl mx-auto mb-8">
            Find and hire verified talent with our comprehensive hiring platform. Choose the plan that fits your hiring needs.
          </p>
          <p className="text-sm text-forest-400 mb-8">
            <Link href="/pricing/talent" className="text-sage-400 hover:text-sage-300 underline">
              Are you talent looking for portfolio boosts? Click here →
            </Link>
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* Starter Plan */}
          <div className="bg-forest-900/50 border-2 border-forest-800 rounded-2xl p-8 hover:border-forest-700 transition-all duration-300">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-forest-50 mb-2">Starter</h2>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sage-400 to-earth-400">$399</span>
                <span className="text-forest-300 text-lg">/month</span>
              </div>
              <p className="text-forest-400">Perfect for small teams and startups</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-200"><strong className="text-forest-50">5 active job postings</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-200"><strong className="text-forest-50">Contact 25 candidates/month</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-200">Search & filter by verified skills</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-200">Basic skill match scoring</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-200">Standard verification reports</span>
              </li>
            </ul>

            <button
              onClick={() => handleGetStarted('starter')}
              className="w-full px-6 py-4 bg-sage-600 hover:bg-sage-700 text-forest-50 rounded-xl font-semibold transition-all transform hover:scale-105"
            >
              Start with Starter →
            </button>
            
            <p className="text-center text-xs text-forest-400 mt-4">
              Cancel anytime • No setup fees
            </p>
          </div>

          {/* Professional Plan */}
          <div className="relative bg-gradient-to-br from-sage-900/40 to-earth-900/40 border-2 border-sage-600 rounded-2xl p-8 hover:shadow-2xl hover:shadow-sage-500/20 transition-all duration-300">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1 bg-gradient-to-r from-sage-600 to-sage-500 text-forest-50 text-sm font-bold rounded-full shadow-lg">
                ⭐ MOST POPULAR
              </span>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-forest-50 mb-2">Professional</h2>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sage-400 to-earth-400">$999</span>
                <span className="text-forest-300 text-lg">/month</span>
              </div>
              <p className="text-forest-300">For growing companies with serious hiring needs</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-100"><strong className="text-forest-50">15 active job postings</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-100"><strong className="text-forest-50">Unlimited candidate contact</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-100">Advanced filters (tech stacks, complexity)</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-100">Detailed verification breakdowns</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-sage-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-100">ATS integration & skill gap analysis</span>
              </li>
            </ul>

            <button
              onClick={() => handleGetStarted('professional')}
              className="w-full px-6 py-4 bg-gradient-to-r from-sage-600 to-sage-500 hover:from-sage-500 hover:to-sage-400 text-forest-50 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-sage-500/30"
            >
              Go Professional →
            </button>
            
            <p className="text-center text-xs text-forest-400 mt-4">
              Most popular choice for growing teams
            </p>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-forest-900/50 border-2 border-amber-600/50 rounded-2xl p-8 hover:border-amber-500/70 transition-all duration-300">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-forest-50 mb-2">Enterprise</h2>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">$2,499</span>
                <span className="text-forest-300 text-lg">/month</span>
              </div>
              <p className="text-forest-400">For large organizations with custom needs</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-200"><strong className="text-forest-50">Unlimited job postings</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-200"><strong className="text-forest-50">Custom verification criteria</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-200">API access & white-label badges</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-200">Dedicated account manager</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-forest-200">Bulk hiring tools & custom assessments</span>
              </li>
            </ul>

            <button
              onClick={() => handleGetStarted('enterprise')}
              className="w-full px-6 py-4 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-forest-50 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-amber-500/30"
            >
              Contact Sales →
            </button>
            
            <p className="text-center text-xs text-forest-400 mt-4">
              Custom pricing available
            </p>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-forest-800">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-forest-50 mb-6">
            Why ProofStack is Different
          </h2>
          <p className="text-xl text-forest-300 max-w-3xl mx-auto">
            Move beyond resumes. Hire based on verified skills and real work samples that candidates have actually created and delivered.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Verified Skills */}
          <div className="bg-forest-900/50 border border-forest-800 rounded-2xl p-8 hover:border-sage-700 transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-r from-sage-600 to-sage-500 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-forest-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-forest-50 mb-4">Verified Skills System</h3>
            <p className="text-forest-300 mb-4">
              Our proprietary AI analyzes actual code, projects, and work samples to verify technical skills. No more guessing if candidates can actually do what they claim.
            </p>
            <ul className="text-sm text-forest-400 space-y-2">
              <li>• AI-powered code analysis</li>
              <li>• GitHub integration & commit verification</li>
              <li>• Cryptographic proof of authenticity</li>
              <li>• Real work sample validation</li>
            </ul>
          </div>

          {/* ProofScore V2 */}
          <div className="bg-forest-900/50 border border-forest-800 rounded-2xl p-8 hover:border-sage-700 transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-r from-amber-600 to-orange-500 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-forest-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-forest-50 mb-4">ProofScore V2 Rating</h3>
            <p className="text-forest-300 mb-4">
              Our advanced scoring system combines communication quality, historical performance, and work quality into a single, reliable metric.
            </p>
            <ul className="text-sm text-forest-400 space-y-2">
              <li>• Communication quality (30%)</li>
              <li>• Historical performance (30%)</li>
              <li>• Work quality & satisfaction (40%)</li>
              <li>• Real employer feedback</li>
            </ul>
          </div>

          {/* Work Sample Security */}
          <div className="bg-forest-900/50 border border-forest-800 rounded-2xl p-8 hover:border-sage-700 transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-forest-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-forest-50 mb-4">Secure Work Samples</h3>
            <p className="text-forest-300 mb-4">
              View real code and projects with configurable confidentiality levels. Candidates can share work while protecting client confidentiality.
            </p>
            <ul className="text-sm text-forest-400 space-y-2">
              <li>• Public, redacted, or encrypted samples</li>
              <li>• Automatic secret detection</li>
              <li>• Audit logging & access controls</li>
              <li>• Anti-scraping protection</li>
            </ul>
          </div>
        </div>

        {/* Skills Categories */}
        <div className="bg-gradient-to-r from-forest-900/50 to-sage-900/30 border border-forest-800 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-forest-50 mb-6 text-center">Verified Skills We Track</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-sage-400 mb-3">Programming Languages</h4>
              <div className="space-y-1 text-sm text-forest-300">
                <div>JavaScript/TypeScript</div>
                <div>Python</div>
                <div>React/Next.js</div>
                <div>Node.js</div>
                <div>Go</div>
                <div>Rust</div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-sage-400 mb-3">Infrastructure</h4>
              <div className="space-y-1 text-sm text-forest-300">
                <div>AWS/Azure/GCP</div>
                <div>Docker/Kubernetes</div>
                <div>Terraform</div>
                <div>CI/CD Pipelines</div>
                <div>DevOps</div>
                <div>Monitoring</div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-sage-400 mb-3">Databases</h4>
              <div className="space-y-1 text-sm text-forest-300">
                <div>PostgreSQL</div>
                <div>MongoDB</div>
                <div>Redis</div>
                <div>Database Design</div>
                <div>Query Optimization</div>
                <div>Data Modeling</div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-sage-400 mb-3">Specialized</h4>
              <div className="space-y-1 text-sm text-forest-300">
                <div>Machine Learning</div>
                <div>Blockchain</div>
                <div>Mobile Development</div>
                <div>Security</div>
                <div>API Design</div>
                <div>System Architecture</div>
              </div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-forest-400 text-sm">
              + 100+ other skills verified through our AI analysis engine
            </p>
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-forest-800">
        <h2 className="text-3xl font-bold text-forest-50 text-center mb-4">
          Feature Comparison
        </h2>
        <p className="text-forest-400 text-center mb-12 max-w-2xl mx-auto">
          Compare what's included in each employer subscription plan
        </p>

        <div className="max-w-6xl mx-auto bg-forest-900/50 border border-forest-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-forest-800">
                  <th className="text-left p-6 text-forest-300 font-semibold">Feature</th>
                  <th className="p-6 text-center text-forest-300 font-semibold">Starter</th>
                  <th className="p-6 text-center text-sage-400 font-semibold">Professional</th>
                  <th className="p-6 text-center text-amber-400 font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-800">
                <tr className="hover:bg-forest-800/30 transition-colors">
                  <td className="p-6 text-forest-200">Active Job Postings</td>
                  <td className="p-6 text-center text-forest-300">5</td>
                  <td className="p-6 text-center text-sage-400 font-semibold">15</td>
                  <td className="p-6 text-center text-amber-400 font-semibold">Unlimited</td>
                </tr>
                <tr className="hover:bg-forest-800/30 transition-colors">
                  <td className="p-6 text-forest-200">Candidate Contacts/Month</td>
                  <td className="p-6 text-center text-forest-300">25</td>
                  <td className="p-6 text-center text-sage-400 font-semibold">Unlimited</td>
                  <td className="p-6 text-center text-amber-400 font-semibold">Unlimited</td>
                </tr>
                <tr className="hover:bg-forest-800/30 transition-colors">
                  <td className="p-6 text-forest-200">Search & Filter by Skills</td>
                  <td className="p-6 text-center">
                    <svg className="w-5 h-5 text-sage-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                  <td className="p-6 text-center">
                    <svg className="w-5 h-5 text-sage-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                  <td className="p-6 text-center">
                    <svg className="w-5 h-5 text-amber-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                </tr>
                <tr className="hover:bg-forest-800/30 transition-colors">
                  <td className="p-6 text-forest-200">Advanced Filters</td>
                  <td className="p-6 text-center">
                    <svg className="w-5 h-5 text-forest-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </td>
                  <td className="p-6 text-center">
                    <svg className="w-5 h-5 text-sage-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                  <td className="p-6 text-center">
                    <svg className="w-5 h-5 text-amber-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                </tr>
                <tr className="hover:bg-forest-800/30 transition-colors">
                  <td className="p-6 text-forest-200">Verification Reports</td>
                  <td className="p-6 text-center text-forest-400 text-sm">Standard</td>
                  <td className="p-6 text-center text-sage-400 font-semibold text-sm">Detailed</td>
                  <td className="p-6 text-center text-amber-400 font-semibold text-sm">Custom</td>
                </tr>
                <tr className="hover:bg-forest-800/30 transition-colors">
                  <td className="p-6 text-forest-200">ATS Integration</td>
                  <td className="p-6 text-center">
                    <svg className="w-5 h-5 text-forest-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </td>
                  <td className="p-6 text-center">
                    <svg className="w-5 h-5 text-sage-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                  <td className="p-6 text-center">
                    <svg className="w-5 h-5 text-amber-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                </tr>
                <tr className="hover:bg-forest-800/30 transition-colors">
                  <td className="p-6 text-forest-200">API Access</td>
                  <td className="p-6 text-center">
                    <svg className="w-5 h-5 text-forest-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </td>
                  <td className="p-6 text-center">
                    <svg className="w-5 h-5 text-forest-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </td>
                  <td className="p-6 text-center">
                    <svg className="w-5 h-5 text-amber-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                </tr>
                <tr className="hover:bg-forest-800/30 transition-colors">
                  <td className="p-6 text-forest-200">Dedicated Account Manager</td>
                  <td className="p-6 text-center">
                    <svg className="w-5 h-5 text-forest-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </td>
                  <td className="p-6 text-center">
                    <svg className="w-5 h-5 text-forest-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </td>
                  <td className="p-6 text-center">
                    <svg className="w-5 h-5 text-amber-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </td>
                </tr>
                <tr className="hover:bg-forest-800/30 transition-colors">
                  <td className="p-6 text-forest-200">Support</td>
                  <td className="p-6 text-center text-forest-400 text-sm">Email</td>
                  <td className="p-6 text-center text-sage-400 font-semibold text-sm">Priority (24h)</td>
                  <td className="p-6 text-center text-amber-400 font-semibold text-sm">Phone + Email</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-forest-50 text-center mb-12">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-6">
          <details className="group bg-forest-900/50 border border-forest-800 rounded-xl p-6 hover:border-sage-700 transition-colors">
            <summary className="cursor-pointer list-none flex items-center justify-between font-semibold text-forest-50">
              <span>What's included in each plan?</span>
              <svg className="w-5 h-5 text-forest-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-forest-300">
              All plans include access to our verified talent marketplace, skill search, and basic verification reports. Higher tiers unlock advanced features like unlimited contacts, ATS integration, custom verification criteria, and dedicated support.
            </p>
          </details>

          <details className="group bg-forest-900/50 border border-forest-800 rounded-xl p-6 hover:border-sage-700 transition-colors">
            <summary className="cursor-pointer list-none flex items-center justify-between font-semibold text-forest-50">
              <span>How does candidate contact work?</span>
              <svg className="w-5 h-5 text-forest-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-forest-300">
              Starter plans include 25 candidate contacts per month. Professional and Enterprise plans offer unlimited contacts. Each contact allows you to message a candidate directly through our platform and view their full verified portfolio.
            </p>
          </details>

          <details className="group bg-forest-900/50 border border-forest-800 rounded-xl p-6 hover:border-sage-700 transition-colors">
            <summary className="cursor-pointer list-none flex items-center justify-between font-semibold text-forest-50">
              <span>What payment methods do you accept?</span>
              <svg className="w-5 h-5 text-forest-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-forest-300">
              We accept all major credit cards (Visa, Mastercard, Amex, Discover) through Stripe. Your payment information is secure and encrypted.
            </p>
          </details>

          <details className="group bg-forest-900/50 border border-forest-800 rounded-xl p-6 hover:border-sage-700 transition-colors">
            <summary className="cursor-pointer list-none flex items-center justify-between font-semibold text-forest-50">
              <span>Can I switch plans anytime?</span>
              <svg className="w-5 h-5 text-forest-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-forest-300">
              Yes! You can upgrade, downgrade, or cancel your plan at any time. Changes take effect immediately, and you'll be charged or refunded on a prorated basis.
            </p>
          </details>

          <details className="group bg-forest-900/50 border border-forest-800 rounded-xl p-6 hover:border-sage-700 transition-colors">
            <summary className="cursor-pointer list-none flex items-center justify-between font-semibold text-forest-50">
              <span>How does skill verification work?</span>
              <svg className="w-5 h-5 text-forest-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-forest-300">
              Our AI engine analyzes actual code samples, GitHub commits, and project complexity to verify technical skills. We check for code quality, best practices, and real-world application. Each skill gets a confidence score based on evidence from multiple work samples.
            </p>
          </details>

          <details className="group bg-forest-900/50 border border-forest-800 rounded-xl p-6 hover:border-sage-700 transition-colors">
            <summary className="cursor-pointer list-none flex items-center justify-between font-semibold text-forest-50">
              <span>What makes ProofStack verification unique?</span>
              <svg className="w-5 h-5 text-forest-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-forest-300">
              Unlike traditional skills tests or certifications, we verify actual work that candidates have created and delivered to real clients. Our system combines cryptographic proof, AI analysis, and GitHub integration to validate authentic work samples, not just test scores.
            </p>
          </details>

          <details className="group bg-forest-900/50 border border-forest-800 rounded-xl p-6 hover:border-sage-700 transition-colors">
            <summary className="cursor-pointer list-none flex items-center justify-between font-semibold text-forest-50">
              <span>Do you offer enterprise discounts?</span>
              <svg className="w-5 h-5 text-forest-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-forest-300">
              Yes! We offer volume discounts for large organizations and custom pricing for enterprise needs. Contact our sales team to discuss your requirements and get a tailored quote.
            </p>
          </details>

          <details className="group bg-forest-900/50 border border-forest-800 rounded-xl p-6 hover:border-sage-700 transition-colors">
            <summary className="cursor-pointer list-none flex items-center justify-between font-semibold text-forest-50">
              <span>How do I get started?</span>
              <svg className="w-5 h-5 text-forest-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="mt-4 text-forest-300">
              Simply choose your plan above and create an account. You'll get immediate access to our talent marketplace and can start posting jobs and contacting verified candidates right away. Setup takes just a few minutes.
            </p>
          </details>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sage-900/40 to-earth-900/40 border border-sage-700/50 p-12 text-center backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-sage-500/10 to-earth-500/10 blur-2xl"></div>
          <div className="relative">
            <h2 className="text-3xl font-bold text-forest-50 mb-4">
              Ready to Find Your Next Hire?
            </h2>
            <p className="text-xl text-forest-300 mb-8 max-w-2xl mx-auto">
              Join companies who trust ProofStack to find verified talent with proven skills and real work samples.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => handleGetStarted('professional')}
                className="px-8 py-4 bg-gradient-to-r from-sage-600 to-sage-500 hover:from-sage-500 hover:to-sage-400 text-forest-50 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-sage-500/30"
              >
                Start 14-Day Trial
              </button>
              <Link
                href="/contact"
                className="px-8 py-4 bg-forest-800 hover:bg-forest-700 text-forest-200 rounded-xl font-semibold transition-all"
              >
                Talk to Sales
              </Link>
            </div>
            <p className="text-sm text-forest-400 mt-6">
              No setup fees • Cancel anytime • Volume discounts available
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
