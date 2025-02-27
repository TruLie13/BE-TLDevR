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

  //@desc Get articles by category with pagination
  //@route GET api/articles/category/:categorySlug?page=1&limit=10
  //@access public
  getArticlesByCategory: asyncHandler(async (req, res) => {
    try {
      // Get category by slug
      const category = await Category.findOne({
        slug: req.params.categorySlug,
      });

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Set up pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Query articles by category ID with pagination
      const articles = await Article.find({ category: category._id })
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "category",
          select: "name slug",
        });

      // Get total count for pagination info
      const total = await Article.countDocuments({ category: category._id });

      return res.status(200).json({
        articles,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
        category: {
          id: category._id,
          name: category.name,
          slug: category.slug,
        },
      });
    } catch (error) {
      console.error("Error fetching articles by category:", error);
      return res.status(500).json({
        message: "Error fetching articles by category",
        error: error.message,
      });
    }
  }),

  //@desc Get featured articles
  //@route GET api/articles/featured
  //@access public
  getFeaturedArticles: asyncHandler(async (req, res) => {
    try {
      // Find featured articles and populate the full article details including category
      const featuredArticles = await Featured.find()
        .populate({
          path: "articleId",
          populate: {
            path: "category",
            select: "name slug",
          },
        })
        .sort({ _id: -1 }); // Sort by most recently added

      // Format the response to match what the frontend expects
      const formattedArticles = featuredArticles
        .map((featured) => {
          const article = featured.articleId;

          if (!article) {
            return null; // Skip if article is not found (might be deleted)
          }

          return {
            _id: featured._id,
            title: article.title,
            slug: article.slug,
            image: article.image,
            category: article.category
              ? {
                  _id: article.category._id,
                  name: article.category.name,
                  slug: article.category.slug,
                }
              : {
                  _id: "uncategorized",
                  name: "Uncategorized",
                  slug: "uncategorized",
                },
            articleId: article._id,
          };
        })
        .filter((article) => article !== null);

      return res.status(200).json(formattedArticles);
    } catch (error) {
      console.error("Error fetching featured articles:", error);
      return res.status(500).json({
        message: "Error fetching featured articles",
        error: error.message,
      });
    }
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
        return res.status(400).json({ message: "Invalid category" });
      }

      const generatedSlug = slug
        ? slug
        : title.toLowerCase().replace(/\s+/g, "-");

      const article = await Article.create({
        title,
        content,
        category,
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

      // If featured, just store the article ID reference
      if (featured) {
        await Featured.create({
          articleId: article._id,
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

    // Handle featured status
    if (prevFeaturedStatus !== updatedArticle.featured) {
      if (updatedArticle.featured) {
        // Add to featured
        await Featured.findOneAndUpdate(
          { articleId: updatedArticle._id },
          { articleId: updatedArticle._id },
          { upsert: true }
        );
      } else {
        // Remove from featured
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
