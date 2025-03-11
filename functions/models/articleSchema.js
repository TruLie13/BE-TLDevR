const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  slug: { type: String, unique: true },
  author: { type: String, required: true },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category", // Reference to Category model
    required: true,
  },
  tags: [{ type: String }],
  content: { type: String, required: true },
  experienceLevel: { type: String, required: true },
  updatedAt: { type: Date },
  metaDescription: { type: String },
  image: { type: String, required: true, unique: true },
  status: { type: String, enum: ["draft", "published"], default: "draft" },
  featured: { type: Boolean, default: false },
  publishedAt: { type: Date, default: Date.now },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  likeRNG: {
    type: Number,
    default: 0,
  },
  likeCount: { type: Number, default: 0 },
});

module.exports = mongoose.model("Article", articleSchema);
