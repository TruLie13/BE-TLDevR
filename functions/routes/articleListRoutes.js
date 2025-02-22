const express = require("express");
const router = express.Router();
const articleController = require("../controllers/articleController");
const validateToken = require("../middleware/validateTokenHandler");

router.route("/featured").get(articleController.getFeaturedArticles);

router.route("/recent").get(articleController.getRecentArticles);

module.exports = router;
