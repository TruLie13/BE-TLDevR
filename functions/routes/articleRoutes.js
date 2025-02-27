const express = require("express");
const router = express.Router();
const articleController = require("../controllers/articleController");
const validateToken = require("../middleware/validateTokenHandler");

router
  .route("/")
  .get(articleController.getAllArticles)
  .post(validateToken, articleController.createArticle);

router
  .route("/category/:categorySlug")
  .get(articleController.getArticlesByCategory);

// Regular article routes by slug
router
  .route("/:slug")
  .get(articleController.getArticleBySlug)
  .put(validateToken, articleController.updateArticle)
  .delete(validateToken, articleController.deleteArticle);

module.exports = router;
