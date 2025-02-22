const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  slug: { type: String, unique: true },
  author: { type: String, required: true },
  category: { type: String, required: true },
  tags: [{ type: String }], // Keywords for SEO
  content: { type: String, required: true },
  experienceLevel: { type: String, required: true },
  updatedAt: { type: Date },
  metaDescription: { type: String },
  image: { type: String, required: true, unique: true }, // URL to image
  status: { type: String, enum: ["draft", "published"], default: "draft" },
  featured: { type: Boolean, default: false },
  publishedAt: { type: Date, default: Date.now },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

module.exports = mongoose.model("Article", articleSchema);
