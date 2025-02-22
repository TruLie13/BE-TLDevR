const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables

const connectDB = async () => {
  try {
    // Check if the connection string is present in the .env file
    if (!process.env.CONNECTION_STRING) {
      throw new Error("MongoDB connection string is undefined.");
    }

    console.log("Connecting to MongoDB...");

    // Attempt to connect to MongoDB using the connection string from .env
    const connect = await mongoose.connect(process.env.CONNECTION_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Log the successful connection
    console.log(`Database connected: ${connect.connection.host}`);
  } catch (err) {
    // If the connection fails, log the error and exit the process
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1); // Exit process if unable to connect to DB
  }
};

module.exports = connectDB; // Export the connectDB function
