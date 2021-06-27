require("dotenv").config({ path: "./config.env" });
const express = require("express");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/error");
const PORT = process.env.PORT || 5000;

// Connect To DB
connectDB();

// Initialize Express Application
const app = express();

// Express Middleware
app.use(express.json());

// Routes to Handle the Auth
app.use("/api/auth", require("./routes/auth"));
app.use("/api/private", require("./routes/private"));

// Error Handler
app.use(errorHandler);

const server = app.listen(PORT, () => console.log(`server Running on ${PORT}`));

// Handle the Server Failure or Errors
process.on("unhandledRejection", (err, promise) => {
  //   console.log(`Logged Error: ${err}`);
  server.close(() => process.exit(1));
});
