const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Article = require('./models/Article');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected for scraping'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if database connection fails
  });


async function scrapeWithPuppeteer(url) {
  const browser = await puppeteer.launch({
    headless: 'new', 
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    console.log(`Loading page: ${url}`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const content = await page.content();
    
    return cheerio.load(content);
    
  } catch (error) {
    console.error(`Error loading page: ${error.message}`);
    throw error;
  } finally {
    // Always close the browser to free up resources
    await browser.close();
  }
}


async function findLastPage(baseUrl) {
  try {
    const $ = await scrapeWithPuppeteer(baseUrl);
    
    let lastPage = 1; // Default to page 1
    

    $('a').each(function() {
      const href = $(this).attr('href');
      if (href) {
        const match = href.match(/\/blogs\/page\/(\d+)/);
        if (match) {
          const pageNum = parseInt(match[1]);
          // Keep track of the highest page number found
          if (pageNum > lastPage) {
            lastPage = pageNum;
          }
        }
      }
    });

    console.log(`Last page found: ${lastPage}`);
    return lastPage;
    
  } catch (error) {
    console.error('Error finding last page:', error.message);
    return 1;
  }
}


async function scrapeArticleLinks(pageUrl) {
  try {
    const $ = await scrapeWithPuppeteer(pageUrl);
    
    const articleLinks = [];
    
    const selectors = [
      'article a',        
      '.post a',          
      '.blog-post a',    
      '.entry a',         
      'h2 a',             
      'h3 a',             
      '.post-title a',    
      '.entry-title a'    
    ];

    for (const selector of selectors) {
      $(selector).each(function() {
        let href = $(this).attr('href');
        
        if (href && href.includes('blog') && !href.includes('#')) {
          if (!href.startsWith('http')) {
            href = 'https://beyondchats.com' + (href.startsWith('/') ? href : '/' + href);
          }
          
          // Avoid adding duplicate links
          if (!articleLinks.includes(href)) {
            articleLinks.push(href);
          }
        }
      });
      
      // Stop if we found at least 5 links
      if (articleLinks.length >= 5) break;
    }

    console.log(`Found ${articleLinks.length} article links`);
    return articleLinks.slice(0, 5); // Return only the first 5 links
    
  } catch (error) {
    console.error('Error scraping article links:', error.message);
    return [];
  }
}


async function scrapeArticleContent(url) {
  try {
    console.log(`Scraping article: ${url}`);
    
    const $ = await scrapeWithPuppeteer(url);
    
    $('script, style, nav, header, footer, aside, .comments, .sidebar').remove();
    

    let title = '';
    const titleSelectors = [
      'h1',              
      '.entry-title',    
      '.post-title',     
      'h1.title',        
      'article h1'       
    ];
    
    for (const selector of titleSelectors) {
      const element = $(selector).first();
      if (element.length) {
        title = element.text().trim();
        if (title) break; 
      }
    }

    let content = '';
    const contentSelectors = [
      'article',           
      '.entry-content',    
      '.post-content',     
      '.article-content',  
      '.content',          
      'main article',      
      '.post-body'         
    ];
    
    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length) {
        content = element.text().trim();
        if (content.length > 200) break; 
      }
    }

    let author = 'Unknown'; 
    const authorSelectors = [
      '.author',
      '.by-author',
      '.post-author',
      '.author-name'
    ];
    
    for (const selector of authorSelectors) {
      const element = $(selector).first();
      if (element.length) {
        author = element.text().trim();
        if (author) break;
      }
    }

    let imageUrl = null;
    const imgSelectors = [
      'article img',           
      '.post-thumbnail img',  
      '.featured-image img',   
      'img'                    
    ];
    
    for (const selector of imgSelectors) {
      const element = $(selector).first();
      if (element.length) {
        imageUrl = element.attr('src');
        
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = 'https://beyondchats.com' + imageUrl;
        }
        
        if (imageUrl) break;
      }
    }

    content = content.replace(/\s+/g, ' ').trim();

    if (!title || !content || content.length < 100) {
      console.log('Insufficient content found');
      return null;
    }

    return {
      title,
      content,
      url,
      author,
      imageUrl,
      type: 'original' 
    };
    
  } catch (error) {
    console.error(`Error scraping article content from ${url}:`, error.message);
    return null;
  }
}

async function scrapeArticles() {
  console.log('='.repeat(60));
  console.log('Starting BeyondChats Article Scraper');
  console.log('='.repeat(60));

  try {
    const baseUrl = 'https://beyondchats.com/blogs/';
    
    console.log('\n📋 Step 1: Finding last page...');
    const lastPage = await findLastPage(baseUrl);
    
    const lastPageUrl = lastPage > 1 
      ? `${baseUrl}page/${lastPage}/` 
      : baseUrl;
    
    console.log(`\n🔗 Step 2: Scraping article links from ${lastPageUrl}`);
    const articleLinks = await scrapeArticleLinks(lastPageUrl);
    
    if (articleLinks.length === 0) {
      console.log('❌ No articles found. Exiting.');
      process.exit(0);
    }

    console.log(`\n📰 Step 3: Scraping ${articleLinks.length} articles...`);
    const articles = [];
    
    for (let i = 0; i < articleLinks.length; i++) {
      console.log(`\n[${i + 1}/${articleLinks.length}]`);
      
      const articleData = await scrapeArticleContent(articleLinks[i]);
      
      if (articleData) {
        articles.push(articleData);
        console.log(`✅ Successfully scraped: ${articleData.title.substring(0, 50)}...`);
      } else {
        console.log(`❌ Failed to scrape article`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n💾 Step 4: Saving ${articles.length} articles to database...`);
    
    for (const articleData of articles) {
      try {
        const existing = await Article.findOne({ url: articleData.url });
        
        if (existing) {
          console.log(`⚠️  Article already exists: ${articleData.title.substring(0, 50)}...`);
        } else {
          await Article.create(articleData);
          console.log(`✅ Saved: ${articleData.title.substring(0, 50)}...`);
        }
      } catch (error) {
        console.error(`❌ Error saving article: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Scraping completed! ${articles.length} articles processed.`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

scrapeArticles();
