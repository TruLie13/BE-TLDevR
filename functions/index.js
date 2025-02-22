const functions = require("firebase-functions");
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

// Middleware to parse JSON request bodies
app.use(express.json());

app.use(express.json());
app.use("/", serverApp);

// Export the app as a Firebase function
exports.api = functions.https.onRequest(app);
