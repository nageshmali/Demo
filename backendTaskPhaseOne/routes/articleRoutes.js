const express = require('express');

const router = express.Router();

const {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle
} = require('../controller/articleController');

router.route('/')
  .get(getArticles)    //GET
  .post(createArticle);  //POST

// Route: /api/articles/:id
router.route('/:id')
  .get(getArticle)      // GET 
  .put(updateArticle)    // PUT 
  .delete(deleteArticle); // DELETE 

module.exports = router;