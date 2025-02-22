const mongoose = require("mongoose");

const FeaturedSchema = new mongoose.Schema({
  articleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Article",
    required: true,
    unique: true,
  },
  title: { type: String, required: true },
  category: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  author: { type: String, required: true },
  publishedAt: { type: Date, default: Date.now },
  image: { type: String },
});

module.exports = mongoose.model("Featured", FeaturedSchema);
