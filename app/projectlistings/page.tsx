'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProjectListingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Hiring
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Browse projects and opportunities from verified employers
          </p>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="inline-block p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
              <svg
                className="w-16 h-16 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Project Listings Coming Soon
            </h2>

            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              We're building a comprehensive job board where employers can post projects and 
              professionals can discover opportunities. This feature will include:
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-8 text-left">
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  📋 Detailed Project Specs
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Budget, timeline, required skills, and deliverables clearly outlined
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  🔍 Smart Matching
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get matched with projects that fit your skills and experience
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  ✅ Verified Employers
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Work with legitimate companies that have been vetted
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  💬 Direct Communication
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Message employers and negotiate terms directly on the platform
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                In the meantime, employers can discover professionals on our{' '}
                <Link href="/employer/discover" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                  Discover Talent
                </Link>
                {' '}page.
              </p>

              <div className="flex gap-4 justify-center">
                <Link
                  href="/portfolios"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Browse Professionals
                </Link>
                <Link
                  href="/employer/discover"
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Employer Discovery
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Employer CTA */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-md p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">
            Are you an employer?
          </h3>
          <p className="mb-4 opacity-90">
            Post your projects and find verified professionals with proven work samples
          </p>
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Get Early Access
          </Link>
        </div>
      </div>
    </div>
  );
}
