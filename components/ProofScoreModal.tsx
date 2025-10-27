'use client';

import ProofScoreV2 from './ProofScoreV2';

interface ProofScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalId: string;
}

export default function ProofScoreModal({ isOpen, onClose, professionalId }: ProofScoreModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your ProofScore Breakdown</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <ProofScoreV2 
            professionalId={professionalId} 
            size="large" 
            showBreakdown={true}
          />
        </div>

        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-sage-500 text-white rounded-lg hover:bg-sage-600 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
