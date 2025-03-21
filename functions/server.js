const cors = require("cors");
const express = require("express");
const connectDB = require("./config/dbConnection");
const errorHandler = require("./middleware/errorHandler");
const dotenv = require("dotenv");

dotenv.config({ path: "/.env" });

connectDB();
const app = express();

app.get("", (_req, res) => {
  res.send("testExpress");
});

app.use(cors());
app.use(express.json());
app.use("/users", require("./routes/userRoutes"));
app.use("/articles", require("./routes/articleRoutes.js"));
app.use("/articleList", require("./routes/articleListRoutes.js"));
app.use("/categories", require("./routes/categoryRoutes.js"));
app.use(errorHandler);

module.exports = app;
