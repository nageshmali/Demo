
require('dotenv').config();

const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const Groq = require('groq-sdk');

const API_URL = process.env.API_URL;

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

console.log('\nStarting Article Enhancement System...\n');

async function fetchArticlesFromAPI() {
  try {
    console.log('Fetching articles from database...');
    
    // This calls: http://localhost:5000/api/articles?type=original
    const response = await axios.get(`${API_URL}/articles?type=original`);
    
    const articles = response.data.data;
    
    console.log(`     Found ${articles.length} original articles\n`);
    return articles;
    
  } catch (error) {
    console.error('      Error:', error.message);
    console.error('      Make sure Phase 1 backend is running!');
    console.error('      Run: cd Desktop\\Task\\backend && npm run dev\n');
    return [];
  }
}


async function searchGoogleForArticle(articleTitle) {
  console.log(`   🔍 Searching Google API for: "${articleTitle.substring(0, 50)}..."`);
  
  try {
    // Build Google Custom Search API URL
    const apiKey = process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_CX;
    const query = encodeURIComponent(articleTitle);
    
    const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}&num=2`;
    
    console.log('      Calling Google API...');
    
    // Make request to Google API
    const response = await axios.get(apiUrl);
    
    const foundLinks = [];
    
    // Extract URLs from response
    if (response.data.items) {
      response.data.items.forEach(item => {
        const url = item.link;
        
        // Filter valid links
        const isValid = (
          url &&
          url.startsWith('http') &&
          !url.includes('youtube.com') &&
          !url.includes('facebook.com') &&
          foundLinks.length < 2
        );
        
        if (isValid) {
          foundLinks.push(url);
          console.log(`        Found: ${url.substring(0, 60)}...`);
        }
      });
    }
    
    console.log(`     Total: ${foundLinks.length} URLs\n`);
    return foundLinks;
    
  } catch (error) {
    console.error('     API error:', error.message);
    return [];
  }
}


async function scrapeContentFromURL(url) {
  try {
    console.log(`        Scraping: ${url.substring(0, 60)}...`);
    
    // Make HTTP request to get the page
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000  // 15 second 
    });
    
    const $ = cheerio.load(response.data);
    
    // Remove unwanted elements
    $(
      'script, style, nav, header, footer, aside, iframe, ' +
      '.advertisement, .ads, .comments, .sidebar, .related-posts'
    ).remove();
    
    // Try multiple selectors to find main content
    let mainContent = '';
    
    const contentSelectors = [
      'article',                    
      '[role="main"]',             
      '.post-content',              
      '.entry-content',             
      '.article-content',           
      '.article-body',              
      '.content',                   
      'main',                       
      '.post-body',                 
      '[itemprop="articleBody"]'    
    ];
    
    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        mainContent = element.text().trim();
        
        if (mainContent.length > 500) {
          break;  
        }
      }
    }
    
    if (!mainContent || mainContent.length < 500) {
      mainContent = $('body').text().trim();
    }
    
    mainContent = mainContent.replace(/\s+/g, ' ').trim();
    
    if (mainContent.length > 4000) {
      mainContent = mainContent.substring(0, 4000);
    }
    
    console.log(`           Extracted ${mainContent.length} characters`);
    return mainContent;
    
  } catch (error) {
    console.error(`           Scrape failed: ${error.message}`);
    return '';
  }
}



async function enhanceArticleWithAI(originalTitle, originalContent, referenceArticles) {
  try {
    console.log('     Calling Groq AI (FREE - Llama 3.3)...');
    
    const ref1 = referenceArticles[0]?.content || 'Not available';
    const ref2 = referenceArticles[1]?.content || 'Not available';
    
    const aiPrompt = `You are an expert SEO content writer. Your task is to rewrite an article to match the quality and style of top-ranking Google articles.

**ORIGINAL ARTICLE:**
Title: ${originalTitle}
Content: ${originalContent.substring(0, 2000)}

**TOP-RANKING ARTICLE #1:**
${ref1.substring(0, 1500)}

**TOP-RANKING ARTICLE #2:**
${ref2.substring(0, 1500)}

**YOUR TASK:**
Rewrite the original article by:
1. Matching the style and tone of the top-ranking articles
2. Using similar heading structure (H2, H3)
3. Making it more comprehensive and engaging
4. Keeping the core topic the same
5. Making it 1000-1500 words
6. Using markdown formatting

**FORMATTING RULES:**
- Use ## for H2 headings
- Use ### for H3 headings
- Use **bold** for emphasis
- Use bullet points where appropriate
- Include introduction, body sections, conclusion

**IMPORTANT:**
- Write in professional, clear English
- Don't mention this is a rewrite
- Don't add meta descriptions
- Just provide the article content

Write the enhanced article now:`;

    console.log('      Waiting for AI response...');
    
    // Call Groq API
    const aiResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",  
      messages: [
        {
          role: "system",
          content: "You are a professional SEO content writer."
        },
        {
          role: "user",
          content: aiPrompt
        }
      ],
      max_tokens: 4000,     
      temperature: 0.7      
    });

    // Extract enhanced content from response
    const enhancedText = aiResponse.choices[0].message.content;
    
    console.log(`     AI generated ${enhancedText.length} characters\n`);
    return enhancedText;
    
  } catch (error) {
    console.error('     AI Error:', error.message);
    
    // Check if API key is invalid
    if (error.message.includes('API key') || error.message.includes('401')) {
      console.error('      Check your GROQ_API_KEY in .env file');
      console.error('      Get key from: https://console.groq.com/');
    }
    
    return null;
  }
}


async function saveEnhancedArticle(originalId, originalTitle, enhancedContent, referenceUrls) {
  try {
    console.log('     Saving to database...');
    
    const articleData = {
      title: `${originalTitle} (Enhanced)`,  // Add suffix
      content: enhancedContent,
      type: 'updated',  // Mark as enhanced version
      originalArticleId: originalId,  // Link to original
      references: referenceUrls  // Store reference URLs
    };
    
    const response = await axios.post(`${API_URL}/articles`, articleData);
    
    console.log('     Saved successfully!\n');
    return response.data;
    
  } catch (error) {
    console.error('     Save failed:', error.message);
    return null;
  }
}


async function processOneArticle(article) {
  console.log('\n' + '='.repeat(80));
  console.log(`📰 PROCESSING ARTICLE`);
  console.log('='.repeat(80));
  console.log(`Title: ${article.title}`);
  console.log(`Content: ${article.content.length} characters`);
  console.log('='.repeat(80) + '\n');
  
  try {
    console.log('  STEP 1: GOOGLE SEARCH\n');
    const googleResults = await searchGoogleForArticle(article.title);
    
    if (googleResults.length === 0) {
      console.log('      No results found. Skipping.\n');
      return { success: false, reason: 'No Google results' };
    }
    
    console.log('  STEP 2: SCRAPE REFERENCES\n');
    const references = [];
    
    for (const url of googleResults) {
      const content = await scrapeContentFromURL(url);
      
      if (content && content.length > 500) {
        references.push({ url, content });
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (references.length === 0) {
      console.log('      Failed to scrape. Skipping.\n');
      return { success: false, reason: 'Scraping failed' };
    }
    
    console.log(`     Scraped ${references.length} articles\n`);
    
    console.log('  STEP 3: AI ENHANCEMENT\n');
    const enhanced = await enhanceArticleWithAI(
      article.title,
      article.content,
      references
    );
    
    if (!enhanced) {
      console.log('      AI failed. Skipping.\n');
      return { success: false, reason: 'AI failed' };
    }
    
    // === STEP 4: ADD REFERENCES ===
    console.log('  STEP 4: ADD REFERENCES\n');
    
    const referencesSection = `

---

## References

This article was enhanced based on insights from:

${references.map((ref, i) => `${i + 1}. [Source ${i + 1}](${ref.url})`).join('\n')}

*Enhanced by AI for improved SEO and readability.*
`;
    
    const finalContent = enhanced + referencesSection;
    
    console.log('  STEP 5: SAVE TO DATABASE\n');
    
    const saved = await saveEnhancedArticle(
      article._id,
      article.title,
      finalContent,
      references.map(r => r.url)
    );
    
    if (saved) {
      console.log('╔═══════════════════════════════════════════╗');
      console.log('║           ✅ SUCCESS!                     ║');
      console.log('║   Article enhanced and saved              ║');
      console.log('╚═══════════════════════════════════════════╝\n');
      return { success: true };
    }
    
    return { success: false, reason: 'Save failed' };
    
  } catch (error) {
    console.error('     Error:', error.message);
    return { success: false, reason: error.message };
  }
}



async function main() {
  console.clear();
  
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║                                                       ║');
  console.log('║       ARTICLE ENHANCEMENT SYSTEM - PHASE 2           ║');
  console.log('║                                                       ║');
  console.log('║       Using FREE Groq AI (Llama 3.3)                 ║');
  console.log('║                                                       ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('\n');
  
  try {
    // === CHECK API ===
    console.log('  Checking backend connection...\n');
    
    try {
      await axios.get(`${API_URL}/articles`);
      console.log('     Backend is running\n');
    } catch (error) {
      console.error('     Cannot connect to backend!');
      console.error('     Start Phase 1:');
      console.error('      1. Open new terminal');
      console.error('      2. cd Desktop\\Task\\backend');
      console.error('      3. npm run dev\n');
      process.exit(1);
    }
    
    const articles = await fetchArticlesFromAPI();
    
    if (articles.length === 0) {
      console.log('    No articles found!');
      console.log('   Run scraper first:');
      console.log('   cd Desktop\\Task\\backend');
      console.log('   npm run scrape\n');
      process.exit(0);
    }
    
    // === PROCESS ARTICLES ===
    console.log(`    Found ${articles.length} articles\n`);
    console.log('    Processing first article (for testing)...\n');
    
    await new Promise(r => setTimeout(r, 2000));
    
    const results = {
      successful: 0,
      failed: 0,
      total: 0
    };
    

    const articlesToProcess = articles;  
    results.total = articlesToProcess.length;
    
    // Process each article
    for (let i = 0; i < articlesToProcess.length; i++) {
      console.log(`\n[Article ${i + 1}/${articlesToProcess.length}]`);
      
      const result = await processOneArticle(articlesToProcess[i]);
      
      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
        console.log(`   ⚠️  Reason: ${result.reason}\n`);
      }
      
      // Wait between articles
      if (i < articlesToProcess.length - 1) {
        console.log('⏳ Waiting 3 seconds...\n');
        await new Promise(r => setTimeout(r, 3000));
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('                          SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Articles:          ${results.total}`);
    console.log(`   Successful:            ${results.successful}`);
    console.log(`   Failed:                ${results.failed}`);
    console.log('='.repeat(80));
    
    if (results.successful > 0) {
      console.log('\n View enhanced articles:');
      console.log('   Browser: http://localhost:5000/api/articles');
      console.log('   MongoDB Compass: beyondchats → articles collection');
    }
    
    
  } catch (error) {
    console.error('\n  FATAL ERROR:', error.message);
    console.error(error.stack);
  }
}

main();