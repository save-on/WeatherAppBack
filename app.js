const path = require('path');
const pool = require("./db");
const express = require("express");
const mainRouter = require("./routes/index");
const errorHandler = require("./middlewares/error-handler");

const cors = require("cors");
const multer = require("multer");
const { errors } = require("celebrate");
require("dotenv").config();

console.log("backend startup: Value of process.env.JWT_TOKEN at startup: ", process.env.JWT_TOKEN);

const app = express();
const PORT = process.env.PORT || 3001;

const startApp = () => {
  app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}... Press Ctrl + C to stop.`);
  });
};

startApp(); // Could be fixed later

app.use(cors({
  origin:'http://localhost:3000'
}));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

app.use("/uploads", cors({ origin: "http://localhost:3000" }), express.static(path.join(__dirname, 'public', 'uploads')));

app.use("/", mainRouter);
app.use(errors());
app.use(errorHandler);

const shutdownHandler = async () => {
  console.log("Closing database connection pool...");
  try {
    await pool.end();
    console.log("Database connection pool is closed");
  } catch (err) {
    console.log(`Error while closing the database connection pool. ${err}`);
  } finally {
    process.exit(0);
  }
};

process.on("SIGINT", shutdownHandler);
process.on("SIGTERM", shutdownHandler);
