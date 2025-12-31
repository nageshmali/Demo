// ============================================
// MAIN APP COMPONENT (WITH DEBUGGING)
// ============================================

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import ArticleCard from './components/ArticleCard';
import Loading from './components/Loading';
import Error from './components/Error';

function App() {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null); // NEW: Debug info

  const API_URL = 'http://localhost:5000/api/articles';

  // ============================================
  // FETCH ARTICLES FROM API
  // ============================================
  
  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching articles from:', API_URL);

      const response = await axios.get(API_URL, {
        params: {
          includeAll: true
        }
      });

      console.log('✅ API Response:', response.data);
      console.log('📊 Response status:', response.status);
      console.log('📦 Response data type:', typeof response.data);

      // NEW: Store debug info
      setDebugInfo({
        status: response.status,
        dataType: typeof response.data,
        hasDataProperty: 'data' in response.data,
        rawResponse: JSON.stringify(response.data, null, 2)
      });

      // Check different possible response formats
      let fetchedArticles = [];
      
      if (response.data.data) {
        // Format: { data: [...] }
        fetchedArticles = response.data.data;
        console.log('📝 Found articles in response.data.data');
      } else if (Array.isArray(response.data)) {
        // Format: [...]
        fetchedArticles = response.data;
        console.log('📝 Found articles in response.data (array)');
      } else if (response.data.articles) {
        // Format: { articles: [...] }
        fetchedArticles = response.data.articles;
        console.log('📝 Found articles in response.data.articles');
      }

      console.log('📚 Total articles found:', fetchedArticles.length);
      console.log('📚 First article:', fetchedArticles[0]);

      if (fetchedArticles.length === 0) {
        console.warn('⚠️ No articles in response!');
      }

      const grouped = groupArticles(fetchedArticles);
      console.log('🔗 Grouped articles:', grouped.length);

      setArticles(grouped);
      setLoading(false);

    } catch (err) {
      console.error('❌ Error fetching articles:', err);
      console.error('❌ Error details:', {
        message: err.message,
        code: err.code,
        response: err.response?.data,
        status: err.response?.status
      });
      
      let errorMessage = 'Failed to fetch articles. ';
      
      if (err.code === 'ERR_NETWORK') {
        errorMessage += 'Backend is not running. Start it with: npm run dev';
      } else if (err.response) {
        errorMessage += `Server error: ${err.response.status}`;
      } else {
        errorMessage += err.message;
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  // ============================================
  // GROUP ARTICLES
  // ============================================
  
  const groupArticles = (articleList) => {
    console.log('🔗 Grouping articles:', articleList.length);
    const grouped = [];

    // Get original articles
    const originals = articleList.filter(a => a.type === 'original');
    console.log('📄 Original articles found:', originals.length);

    // Get updated articles
    const updated = articleList.filter(a => a.type === 'updated');
    console.log('✨ Updated articles found:', updated.length);

    // If we have originals, pair them with enhanced versions
    if (originals.length > 0) {
      originals.forEach(original => {
        const enhanced = updated.find(
          a => a.originalArticleId?._id === original._id || 
               a.originalArticleId === original._id
        );

        grouped.push({
          original: original,
          enhanced: enhanced || null
        });
      });
    } else if (updated.length > 0) {
      // If we only have updated articles, show them with their original references
      console.log('⚠️ Only enhanced articles found. Showing them individually.');
      updated.forEach(enhanced => {
        grouped.push({
          original: enhanced.originalArticleId || null,
          enhanced: enhanced
        });
      });
    }

    console.log('✅ Grouped pairs:', grouped.length);
    return grouped;
  };

  // ============================================
  // CALCULATE STATS
  // ============================================
  
  const getStats = () => {
    const originalCount = articles.length;
    const enhancedCount = articles.filter(a => a.enhanced !== null).length;
    const totalCount = originalCount + enhancedCount;

    return { totalCount, originalCount, enhancedCount };
  };

  const stats = getStats();

  // ============================================
  // RUN ON COMPONENT MOUNT
  // ============================================
  
  useEffect(() => {
    fetchArticles();
  }, []);

  // ============================================
  // RENDER LOADING STATE
  // ============================================
  
  if (loading) {
    return <Loading />;
  }

  // ============================================
  // RENDER ERROR STATE
  // ============================================
  
  if (error) {
    return (
      <div>
        <Error message={error} onRetry={fetchArticles} />
        
        {/* Debug Panel */}
        {debugInfo && (
          <div className="max-w-4xl mx-auto mt-8 p-6 bg-gray-900 text-white rounded-lg">
            <h3 className="text-xl font-bold mb-4">🔍 Debug Information</h3>
            <pre className="text-xs overflow-auto">
              {debugInfo.rawResponse}
            </pre>
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // RENDER EMPTY STATE
  // ============================================
  
  if (articles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-2xl">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">No Articles Found</h2>
          <p className="text-gray-600 mb-6">Run the scraper to get articles:</p>
          <code className="bg-gray-800 text-white px-4 py-2 rounded block mb-6">
            cd backend && npm run scrape
          </code>

          {/* Debug Panel */}
          {debugInfo && (
            <div className="mt-8 p-6 bg-gray-900 text-white rounded-lg text-left">
              <h3 className="text-xl font-bold mb-4">🔍 Debug Information</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Status:</strong> {debugInfo.status}</p>
                <p><strong>Data Type:</strong> {debugInfo.dataType}</p>
                <p><strong>Has 'data' property:</strong> {debugInfo.hasDataProperty ? 'Yes' : 'No'}</p>
              </div>
              <pre className="mt-4 text-xs overflow-auto bg-gray-800 p-4 rounded">
                {debugInfo.rawResponse}
              </pre>
              
              <button 
                onClick={fetchArticles}
                className="mt-4 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
              >
                🔄 Retry Fetch
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER MAIN APP
  // ============================================
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        totalArticles={stats.totalCount}
        originalCount={stats.originalCount}
        enhancedCount={stats.enhancedCount}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {articles.map((articlePair, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center mb-6">
                <span className="inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-semibold">
                  Article Pair {index + 1}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Original Article */}
                {articlePair.original && articlePair.original.content ? (
                  <ArticleCard
                    article={articlePair.original}
                    type="original"
                  />
                ) : (
                  <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center p-8">
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">📄</div>
                      <p className="font-medium">Original Article</p>
                      {articlePair.original?.title && (
                        <p className="text-sm mt-2 font-semibold">{articlePair.original.title}</p>
                      )}
                      {articlePair.original?.url && (
                        <a 
                          href={articlePair.original.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline text-xs mt-2 block"
                        >
                          View Original Source →
                        </a>
                      )}
                      <p className="text-xs mt-2 text-gray-400">Full content not available</p>
                    </div>
                  </div>
                )}

                {/* Enhanced Article */}
                {articlePair.enhanced ? (
                  <ArticleCard
                    article={articlePair.enhanced}
                    type="enhanced"
                  />
                ) : (
                  <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center p-8">
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">⏳</div>
                      <p className="font-medium">No Enhanced Version Yet</p>
                      <p className="text-sm mt-2">Run Phase 2 to create it</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            © 2024 BeyondChats Article Management System | Phase 3 - React Frontend
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Powered by MERN Stack + Groq AI
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;