const asyncHandler = require("express-async-handler");
const Category = require("../models/categorySchema");

//@desc Get all categories
//@route GET /api/categories
//@access Public
const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find();
  res.status(200).json(categories);
});

//@desc Create a new category
//@route POST /api/categories
//@access Private (Admin only)
const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Category name is required" });
  }

  // Generate slug from name
  const slug = name.toLowerCase().replace(/\s+/g, "-");

  const categoryExists = await Category.findOne({ slug });
  if (categoryExists) {
    return res.status(400).json({ message: "Category already exists" });
  }

  const category = await Category.create({ name, slug });
  res.status(201).json(category);
});

//@desc Create a new category
//@route PUT /api/categories
//@access Private (Admin only)
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newName } = req.body;

  if (!newName) {
    return res.status(400).json({ message: "New category name is required" });
  }

  const category = await Category.findById(id);

  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  if (category.name === newName) {
    return res
      .status(400)
      .json({
        message: "New category name must be different from the existing name",
      });
  }

  category.name = newName;
  category.slug = newName.toLowerCase().replace(/\s+/g, "-");

  await category.save();
  res.status(200).json(category);
});

//@desc Delete a category
//@route DELETE /api/categories/:id
//@access Private (Admin only)
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  await category.deleteOne();
  res.status(200).json({ message: "Category deleted successfully" });
});

module.exports = {
  getAllCategories,
  createCategory,
  deleteCategory,
  updateCategory,
};
