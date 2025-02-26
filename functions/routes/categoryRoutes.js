const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const validateToken = require("../middleware/validateTokenHandler");

router
  .route("/")
  .get(categoryController.getAllCategories)
  .post(validateToken, categoryController.createCategory);

router.route("/previews").get(categoryController.getCategoryPreviews);

router
  .route("/:id")
  .put(validateToken, categoryController.updateCategory)
  .delete(validateToken, categoryController.deleteCategory);

module.exports = router;
