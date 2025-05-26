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

app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.url}`);
  next();
});
app.use(cors());
console.log("Middleware Regiestered: cors");

app.use(express.json({ limit: "100mb" }));
console.log("Middleware registered: express.json");

app.use(express.urlencoded({ extended: true, limit: "100mb" }));
console.log("Middleware registered: express.urlncoded");

//routers
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));
console.log("Middleware Registered: static /uploads public");
app.use("/packing-lists", packingLists);
console.log("Middleware Registered: /packing-lists router");
app.use("/trips", tripRoutes);
console.log("Middleware Registered: /trips router");
app.use("/", mainRouter);
console.log("Middleware Registered: / main router");

//error handlers
//app.use(errors());
app.use(errorHandler);
console.log("Middleware Registered: errorHandler");

app.use((req, res, next) => {
  console.warn(`404 Not Found: ${req.method} ${req.url}`);
  res
    .status(404)
    .json({ message: `Cannot ${req.method} ${req.url}. Route not found.` });
});

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
