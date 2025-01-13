const pool = require("./db");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3001;

const startApp = () => {
  app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}... Press Ctrl + C to stop.`);
  });
};

app.use(express.json());

startApp();

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
