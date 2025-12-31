// ============================================
// HEADER COMPONENT
// ============================================
// Top navigation bar

import React from 'react';

function Header({ totalArticles, originalCount, enhancedCount }) {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        {/* Title */}
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold mb-2">
            📚 BeyondChats Articles
          </h1>
          <p className="text-blue-100 text-lg">
            Original Articles vs AI-Enhanced Versions
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 mt-6">
          <div className="text-center">
            <div className="text-3xl font-bold">{totalArticles}</div>
            <div className="text-sm text-blue-100">Total Articles</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{originalCount}</div>
            <div className="text-sm text-blue-100">Original</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{enhancedCount}</div>
            <div className="text-sm text-blue-100">Enhanced</div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;