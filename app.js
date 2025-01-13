const pool = require("./db");
const express = require("express");

const app = express();
const PORT = 3001;

app.use(express.json());

const startApp = () => {
  app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}... Press Ctrl + C to stop.`);
  });
};

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
