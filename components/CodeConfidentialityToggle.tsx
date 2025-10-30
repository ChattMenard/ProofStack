'use client';

import { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';

interface CodeConfidentialityToggleProps {
  sampleId: string;
  isConfidential: boolean;
  analysisComplete: boolean;
  onToggle?: () => void;
}

export default function CodeConfidentialityToggle({
  sampleId,
  isConfidential,
  analysisComplete,
  onToggle
}: CodeConfidentialityToggleProps) {
  const [loading, setLoading] = useState(false);
  const [currentState, setCurrentState] = useState(isConfidential);

  const handleToggle = async () => {
    if (!analysisComplete) {
      alert('AI analysis must be complete before making code confidential');
      return;
    }

    setLoading(true);

    try {
      const functionName = currentState ? 'make_sample_public' : 'make_sample_confidential';
      const { data, error } = await supabase.rpc(functionName, { sample_id: sampleId });

      if (error) throw error;

      setCurrentState(!currentState);
      if (onToggle) onToggle();
    } catch (error: any) {
      console.error('Error toggling confidentiality:', error);
      alert(error.message || 'Failed to update confidentiality setting');
    } finally {
      setLoading(false);
    }
  };

  if (!analysisComplete) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>Complete AI analysis to enable code privacy</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {currentState ? (
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          )}
        </div>
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">
            Code Privacy
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {currentState ? (
              <>
                🔒 <strong>Confidential:</strong> Only you and AI analysis results are visible. Employers see your skills without seeing your code.
              </>
            ) : (
              <>
                🔓 <strong>Public:</strong> Employers can view your code along with AI analysis results.
              </>
            )}
          </p>
        </div>
      </div>

      <button
        onClick={handleToggle}
        disabled={loading}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          currentState ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            currentState ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
