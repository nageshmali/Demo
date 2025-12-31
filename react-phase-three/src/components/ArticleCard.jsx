// ============================================
// ARTICLE CARD COMPONENT
// ============================================
// Displays a single article in a card

import React from 'react';

function ArticleCard({ article, type }) {
    
  // Truncate long text
  const truncate = (text, maxLength) => {
    if (!text) return 'No content available';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'Unknown date';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      {/* Card Header */}
      <div
        className={`p-4 ${
          type === 'original' ? 'bg-blue-500' : 'bg-green-500'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold text-sm uppercase tracking-wide">
            {type === 'original' ? '📄 Original' : '✨ Enhanced'}
          </span>
          {article.createdAt && (
            <span className="text-white text-xs opacity-90">
              {formatDate(article.createdAt)}
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">
          {article.title}
        </h3>

        {/* Author */}
        {article.author && (
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <span className="mr-2">👤</span>
            <span>{article.author}</span>
          </div>
        )}

        {/* Content Preview */}
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          {truncate(article.content, 200)}
        </p>

        {/* Word Count */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>📝 {article.content?.split(' ').length || 0} words</span>
          {article.type && (
            <span className="uppercase font-semibold">{article.type}</span>
          )}
        </div>

        {/* References (for enhanced articles) */}
        {article.references && article.references.length > 0 && (
          <div className="border-t pt-3 mt-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              📚 References:
            </p>
            <div className="space-y-1">
              {article.references.slice(0, 2).map((ref, index) => (
                <a
                  key={index}
                  href={ref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-blue-600 hover:text-blue-800 truncate"
                >
                  {index + 1}. {ref}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* View Full Article Button */}
        <button
          onClick={() => {
            alert(`Full article:\n\n${article.content}`);
          }}
          className={`mt-4 w-full py-2 px-4 rounded-md text-white font-medium transition-colors duration-200 ${
            type === 'original'
              ? 'bg-blue-500 hover:bg-blue-600'
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          Read Full Article
        </button>
      </div>
    </div>
  );
}

export default ArticleCard;
