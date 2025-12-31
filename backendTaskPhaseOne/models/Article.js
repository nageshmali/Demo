const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
  {
    // Title 
    title: {
      type: String,
      required: true,
      trim: true
    },
    
    // Main content
    content: {
      type: String,
      required: true
    },
    
    // URL where article was found
    url: {
      type: String,
      trim: true
    },
    
    //Author
    author: {
      type: String,
      trim: true,
      default: 'Unknown'
    },
    
    publishedDate: {
      type: Date
    },
    
    imageUrl: {
      type: String
    },
    
    type: {
      type: String,
      enum: ['original', 'updated'],
      default: 'original'
    },
    

    originalArticleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article',
      default: null
    },
    references: [{
      type: String
    }],
    scraped: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

articleSchema.index({ type: 1, createdAt: -1 });
articleSchema.index({ originalArticleId: 1 });

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;