const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables

const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...");

    const connect = await mongoose.connect(process.env.CONNECTION_STRING);

    // Log the successful connection
    console.log(`Database connected: ${connect.connection.host}`);
  } catch (err) {
    // If the connection fails, log the error and exit the process
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1); // Exit process if unable to connect to DB
  }
};

module.exports = connectDB; // Export the connectDB function
