// ============================================
// LOADING COMPONENT
// ============================================
// Shows while fetching data

import React from 'react';

function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      <p className="mt-4 text-gray-600 text-lg">Loading articles...</p>
    </div>
  );
}

export default Loading;