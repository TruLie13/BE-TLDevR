const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Unique category name
  slug: { type: String, required: true, unique: true }, // URL-friendly version of the name
});

module.exports = mongoose.model("Category", categorySchema);
