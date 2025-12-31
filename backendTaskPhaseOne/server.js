const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const connectDB = require('./config/db');
const articleRoutes = require('./routes/articleRoutes');

dotenv.config();

connectDB();
const app = express();
app.use(cors());


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/articles', articleRoutes);


//Homepage
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'BeyondChats API is running',
    version: '1.0.0',
    endpoints: {
      articles: '/api/articles',
      singleArticle: '/api/articles/:id'
    }
  });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`Server running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}`);
  console.log(`========================================`);
});