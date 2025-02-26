const asyncHandler = require("express-async-handler");
const Article = require("../models/articleSchema.js");
const Featured = require("../models/featuredSchema.js");
const Category = require("../models/categorySchema.js");
const { isValidObjectId } = require("mongoose");

const checkIsSlugValid = (req, res) => {
  console.log("checkIsSlugValid called");
  if (!req.params.slug) {
    res.status(400).json({ error: "Invalid article slug format" });
    return;
  }
};

const articleController = {
  //@desc Get all articles
  //@route GET api/articles
  //@access public
  getAllArticles: asyncHandler(async (req, res) => {
    const articles = await Article.find().populate("category");
    res.status(200).json(articles);
  }),

  //@desc Get featured articles
  //@route GET api/articles/featured
  //@access public
  getFeaturedArticles: asyncHandler(async (req, res) => {
    const featuredArticles = await Featured.find().select(
      "title category slug author publishedAt image"
    );

    res.status(200).json(featuredArticles || []);
  }),

  //@desc Get X most recent articles
  //@route GET api/articles/recent/:x
  //@access public
  getRecentArticles: asyncHandler(async (req, res) => {
    try {
      const articles = await Article.find()
        .sort({ publishedAt: -1 })
        .limit(5)
        .populate("category");
      return res.status(200).json(articles);
    } catch (error) {
      console.error("Error fetching recent articles:", error);
      return res.status(500).json({
        message: "Error fetching recent articles",
        error: error.message,
      });
    }
  }),

  //@desc Create new article
  //@route POST api/articles
  //@access private
  createArticle: asyncHandler(async (req, res) => {
    try {
      console.log("Request body:", req.body); // Add this for debugging

      const {
        title,
        content,
        category,
        slug,
        author,
        tags,
        metaDescription,
        image,
        status,
        experienceLevel,
        featured = false,
      } = req.body;

      if (!title || !content || !category || !author) {
        console.log("Missing required fields"); // Add this for debugging
        return res.status(400).json({
          message: "Title, content, category, and author are mandatory fields",
        });
      }

      const mongoose = require("mongoose");
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({
          message:
            "Category must be a valid ID. Please select a category from the dropdown.",
        });
      }

      // Check if category exists
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        console.log("Category not found"); // Add this for debugging
        return res.status(400).json({ message: "Invalid category" });
      }

      const generatedSlug = slug
        ? slug
        : title.toLowerCase().replace(/\s+/g, "-");

      const article = await Article.create({
        title,
        content,
        category, // Category ID
        slug: generatedSlug,
        author: author || "Anonymous",
        tags: tags || [],
        metaDescription: metaDescription || "",
        image: image || "",
        status: status || "draft",
        user_id: req.user.id,
        featured: featured || false,
        experienceLevel: experienceLevel || "0",
      });

      if (featured) {
        await Featured.create({
          articleId: article._id,
          title: article.title,
          category: article.category,
          slug: article.slug,
          author: article.author,
          image: article.image,
        });
      }

      return res.status(201).json(article);
    } catch (error) {
      console.error("Error creating article:", error);

      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        const fieldDisplay = field === "slug" ? "slug" : field;
        return res
          .status(400)
          .json({ message: `${fieldDisplay} must be unique` });
      }

      return res
        .status(500)
        .json({ message: "Error creating article", error: error.message });
    }
  }),

  //@desc Get article by slug
  //@route GET api/articles/:slug
  //@access public
  getArticleBySlug: asyncHandler(async (req, res) => {
    checkIsSlugValid(req, res);
    // Add .populate('category') to include full category data
    const article = await Article.findOne({ slug: req.params.slug }).populate(
      "category"
    );

    if (!article) {
      res.status(404);
      throw new Error("Article not found");
    }

    res.status(200).json(article);
  }),

  // Also update other retrieval methods like getAllArticles
  getAllArticles: asyncHandler(async (req, res) => {
    const articles = await Article.find().populate("category");
    res.status(200).json(articles);
  }),

  //@desc Update article
  //@route PUT api/articles/:slug
  //@access private
  updateArticle: asyncHandler(async (req, res) => {
    checkIsSlugValid(req, res);

    const article = await Article.findOne({ slug: req.params.slug });

    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    if (article.user_id.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "User cannot update other user's articles" });
    }

    const prevFeaturedStatus = article.featured;
    const { slug, ...updateFields } = req.body;

    await Article.updateOne({ slug: req.params.slug }, { $set: updateFields });
    const updatedArticle = await Article.findOne({ slug: req.params.slug });

    if (prevFeaturedStatus || prevFeaturedStatus !== updatedArticle.featured) {
      if (updatedArticle.featured) {
        await Featured.updateOne(
          { articleId: updatedArticle._id },
          {
            title: updatedArticle.title,
            category: updatedArticle.category,
            slug: updatedArticle.slug,
            author: updatedArticle.author,
            image: updatedArticle.image,
          },
          { upsert: true }
        );
      } else {
        await Featured.deleteOne({ articleId: updatedArticle._id });
      }
    }

    return res.status(200).json(updatedArticle);
  }),

  //@desc Delete article
  //@route DELETE api/articles/:slug
  //@access private
  deleteArticle: asyncHandler(async (req, res) => {
    checkIsSlugValid(req, res);
    const article = await Article.findOne({ slug: req.params.slug });

    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    if (article.user_id.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "User cannot delete other user's articles" });
    }

    await Article.findByIdAndDelete(article._id);
    res.status(200).json({ message: "Article deleted successfully", article });
  }),
};

module.exports = articleController;
