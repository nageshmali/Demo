// ============================================
// ERROR COMPONENT
// ============================================
// Shows when API fails

import React from 'react';

function Error({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 max-w-md text-center">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
        <p className="text-gray-700 mb-6">{message}</p>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-6 rounded-md transition-colors"
          >
            Try Again
          </button>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <p className="font-semibold mb-2">💡 Common fixes:</p>
          <ul className="text-left space-y-1">
            <li>• Make sure backend is running (Phase 1)</li>
            <li>• Check: http://localhost:5000/api/articles</li>
            <li>• Run: cd backend && npm run dev</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Error;