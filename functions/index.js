const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const serverApp = require("./server");

const app = express();

// Enable CORS for all origins
app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());
app.use("/", serverApp);

app.use((err, req, res, next) => {
  logger.error("Error:", err);
  res.status(500).send("Server error");
});

serverApp.use((err, req, res, next) => {
  logger.error("Error:", err);
  res.status(500).send("Server error");
});

// Export the app as a Firebase function
exports.api = onRequest(app);
