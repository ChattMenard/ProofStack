'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SKILL_LEVELS = [
  {
    id: 'junior',
    title: 'Junior / Low-Level Dev',
    yearsExp: '0-2 years',
    color: 'from-blue-500 to-blue-600',
    borderColor: 'border-blue-500',
    icon: '🌱',
    projects: [
      'Bug fixes and small features',
      'Unit tests and documentation',
      'Refactoring existing code',
      'Internal tools and scripts'
    ],
    skills: [
      'One language proficiency',
      'Basic data structures & algorithms',
      'Git fundamentals',
      'Framework basics (React, Django, etc.)',
      'Can implement from clear specs'
    ],
    scope: 'Individual tasks, 1-2 week sprints',
    question: 'How do I solve this?'
  },
  {
    id: 'mid',
    title: 'Mid-Level Dev',
    yearsExp: '2-5 years',
    color: 'from-green-500 to-green-600',
    borderColor: 'border-green-500',
    icon: '🌿',
    projects: [
      'Full features end-to-end',
      'API design and implementation',
      'Database schema design',
      'Integration with 3rd party services',
      'Performance optimization'
    ],
    skills: [
      '2-3 languages, deep in one stack',
      'Design patterns & architecture basics',
      'Testing strategies (unit, integration, e2e)',
      'CI/CD pipelines',
      'Independent problem solver'
    ],
    scope: 'Features/modules, 1-2 month projects',
    question: 'What\'s the best way to solve this?'
  },
  {
    id: 'senior',
    title: 'Senior / High-Level Dev',
    yearsExp: '5-10 years',
    color: 'from-purple-500 to-purple-600',
    borderColor: 'border-purple-500',
    icon: '🌳',
    projects: [
      'System architecture and design',
      'Complex distributed systems',
      'Technical strategy for major initiatives',
      'Cross-team projects',
      'Production incidents and postmortems'
    ],
    skills: [
      'Multiple tech stacks, polyglot',
      'System design & scalability',
      'Security, observability, reliability',
      'Mentoring and code review leadership',
      'Technology evaluation and selection'
    ],
    scope: 'Systems/products, quarterly planning',
    question: 'Should we even solve this? What are alternatives?'
  },
  {
    id: 'lead',
    title: 'Tech Lead / Lead Dev',
    yearsExp: '10+ years',
    color: 'from-amber-500 to-amber-600',
    borderColor: 'border-amber-500',
    icon: '👑',
    projects: [
      'Technical roadmap and vision',
      'Architecture decisions across teams',
      'Setting engineering standards',
      'Hiring and team building',
      'Strategic technical debt management'
    ],
    skills: [
      'All of senior +',
      'Project management',
      'Stakeholder communication',
      'Technical writing and RFCs',
      'Mentorship at scale',
      'Business acumen'
    ],
    scope: 'Organization-wide, annual strategy',
    question: 'How does this fit into our 2-year strategy?'
  }
];

interface OnboardingFlowProps {
  profileId: string;
}

export default function OnboardingFlow({ profileId }: OnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  async function handleComplete() {
    try {
      // Mark onboarding as complete
      const response = await fetch('/api/profile/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, completed: true })
      });

      if (response.ok) {
        router.push('/professional/dashboard');
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-950 via-forest-900 to-forest-950 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          {/* Welcome */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">
              Welcome to ProofStack! 🎉
            </h1>
            <p className="text-xl text-gray-300">
              Let's help you showcase your skills at the right level
            </p>
          </div>

          {/* Level Cards */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Choose Your Developer Level
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
              Select the level that best matches your experience. You can take assessments to verify your level.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {SKILL_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => {
                    setSelectedLevel(level.id);
                    setStep(2);
                  }}
                  className={`text-left p-6 rounded-xl border-2 transition-all transform hover:scale-105 hover:shadow-xl ${
                    selectedLevel === level.id
                      ? `${level.borderColor} bg-gradient-to-r ${level.color} bg-opacity-10`
                      : 'border-gray-300 dark:border-gray-600 hover:border-sage-400'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{level.icon}</span>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {level.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {level.yearsExp}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-3">
                    "{level.question}"
                  </p>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <strong>Scope:</strong> {level.scope}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => handleComplete()}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2 && selectedLevel) {
    const level = SKILL_LEVELS.find(l => l.id === selectedLevel)!;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-950 via-forest-900 to-forest-950 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          {/* Level Details */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-6xl">{level.icon}</span>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {level.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{level.yearsExp} experience</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Projects */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Typical Projects
                </h3>
                <ul className="space-y-2">
                  {level.projects.map((project, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-sage-500 mt-1">✓</span>
                      {project}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Expected Skills
                </h3>
                <ul className="space-y-2">
                  {level.skills.map((skill, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-sage-500 mt-1">✓</span>
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Scope */}
            <div className="bg-gradient-to-r from-sage-50 to-earth-50 dark:from-gray-700 dark:to-gray-700 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Work Scope</h4>
                  <p className="text-gray-700 dark:text-gray-300">{level.scope}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={`/professional/assessment?level=${level.id}`}
                className="flex-1 text-center px-6 py-4 bg-gradient-to-r from-sage-600 to-sage-500 text-white font-semibold rounded-xl hover:from-sage-500 hover:to-sage-400 transition-all transform hover:scale-105 shadow-lg"
              >
                Take {level.title} Assessment →
              </Link>
              <button
                onClick={() => setStep(1)}
                className="px-6 py-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                ← Back
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => handleComplete()}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
              >
                Continue to dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
