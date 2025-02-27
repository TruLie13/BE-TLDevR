const mongoose = require("mongoose");

const FeaturedSchema = new mongoose.Schema({
  articleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Article",
    required: true,
    unique: true,
  },
});

module.exports = mongoose.model("Featured", FeaturedSchema);
