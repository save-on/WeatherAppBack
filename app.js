require("dotenv").config();
const path = require("path");
const pool = require("./db");
const express = require("express");
const mainRouter = require("./routes/index");
const errorHandler = require("./middlewares/error-handler");
const packingLists = require("./routes/packingLists");
const tripRoutes = require("./routes/trips");
const cors = require("cors");
const multer = require("multer");
const { errors } = require("celebrate");

const app = express();
const PORT = process.env.PORT || 3001;

const startApp = () => {
  app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}... Press Ctrl + C to stop.`);
  });
};

startApp(); // Could be fixed later

app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

//routers
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));
app.use("/packing-lists", packingLists);
app.use("/trips", tripRoutes);
app.use("/", mainRouter);

//error handlers
// app.use(errors());
app.use(errorHandler);
// app.use("/uploads", express.static("uploads"));

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
