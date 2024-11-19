'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GenerateReport() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate');
      const data = await response.json();

      if (data.success) {
        // Open the generated PDF in a new tab
        window.open(data.file, '_blank');
        router.refresh(); // Refresh the page to update the reports list
      } else {
        setError(data.message || 'Failed to generate report');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 
                   disabled:bg-blue-300 transition-colors duration-200 flex items-center"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating Report...
          </>
        ) : (
          'Generate Now'
        )}
      </button>

      {error && (
        <div className="mt-3 text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}