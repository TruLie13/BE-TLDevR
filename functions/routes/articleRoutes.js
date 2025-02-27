const express = require("express");
const router = express.Router();
const articleController = require("../controllers/articleController");
const validateToken = require("../middleware/validateTokenHandler");

router
  .route("/")
  .get(articleController.getAllArticles)
  .post(validateToken, articleController.createArticle);

router.route("/:categorySlug").get(articleController.getArticlesByCategory);

router
  .route("/:slug")
  .get(articleController.getArticleBySlug)
  .put(validateToken, articleController.updateArticle)
  .delete(validateToken, articleController.deleteArticle);

module.exports = router;
