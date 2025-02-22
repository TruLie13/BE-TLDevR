const asyncHandler = require("express-async-handler");
const Article = require("../models/articleSchema.js");
const Featured = require("../models/featuredSchema.js");
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
    const articles = await Article.find();
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
        .sort({ publishedAt: -1 }) // Sort by publishedAt in descending order (newest first)
        .limit(5); // Limit to the X most recent articles

      return res.status(200).json(articles); // Return the recent articles
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
        slug, // Slug is now optional in the request body
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

      // Generate slug automatically if not provided
      const generatedSlug = slug
        ? slug
        : title.toLowerCase().replace(/\s+/g, "-");

      const article = await Article.create({
        title,
        content,
        category,
        slug: generatedSlug, // Use either the provided slug or the generated one
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

      res.status(201).json(article);
    } catch (error) {
      console.error("Error creating article:", error);

      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0]; // Extracts the duplicate field name
        const fieldDisplay = field === "slug" ? "Title" : field;
        return res
          .status(400)
          .json({ message: `${fieldDisplay} must be unique` });
      }

      res
        .status(500)
        .json({ message: "Error creating article", error: error.message });
    }
  }),

  //@desc Get article by slug
  //@route GET api/articles/:slug
  //@access public
  getArticleBySlug: asyncHandler(async (req, res) => {
    checkIsSlugValid(req, res);
    const article = await Article.findOne({ slug: req.params.slug });
    if (!article) {
      res.status(404);
      throw new Error("Article not found");
    }
    res.status(200).json(article);
  }),

  //@desc Update article
  //@route PUT api/articles/:slug
  //@access private
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

    // Ensure the slug remains unchanged
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
          { upsert: true } // Creates if it doesn't exist
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

    console.log("Article User ID:", article.user_id.toString()); // Log the article's user_id
    console.log("Request User ID:", req.user.id); // Log the user_id from the token

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
