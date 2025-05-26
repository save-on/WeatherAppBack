require("dotenv").config();
const { Pool } = require("pg");

const isProduction = process.env.NODE_ENV === "production";

if (
  process.env.NODE_ENV === "development" &&
  (!process.env.DB_HOST ||
    !process.env.DB_USER ||
    !process.env.DB_PASSWORD ||
    !process.env.DB_NAME)
) {
  throw new Error(
    "Missing required environment variables for database connection"
  );
}

console.log("DB_DEBUG: NODE_ENV:", process.env.NODE_ENV);
console.log("DB_DEBUG: isProduction:", isProduction);

if (isProduction) {
  console.log("DB_DEBUG: Using Production connection via DATABASE_URL:");
  console.log("DB_DEBUG: DATABASE_URL:", process.env.DATABASE_URL);
} else {
  console.log("DB_DEBUG: Using Development connection via DB_* variables:");
  console.log("DB_DEBUG: DB_USER:", process.env.DB_USER);
  console.log("DB_DEBUG: DB_HOST:", process.env.DB_HOST);
  console.log("DB_DEBUG: DB_NAME:", process.env.DB_NAME);
  console.log("DB_DEBUG: DB_PASSWORD (first 3 chars):", process.env.DB_PASSWORD ? process.env.DB_PASSWORD.substring(0, 3) + '...' : 'undefined'); // Log partially for security
  console.log("DB_DEBUG: DB_PORT:", process.env.DB_PORT);
}

const pool = new Pool({
  connectionString: isProduction ? process.env.DATABASE_URL : undefined,
  host: isProduction ? undefined : process.env.DB_HOST,
  user: isProduction ? undefined : process.env.DB_USER,
  password: isProduction ? undefined : process.env.DB_PASSWORD,
  database: isProduction ? undefined : process.env.DB_NAME,
  port: isProduction ? undefined : process.env.DB_PORT || 5432,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

module.exports = pool;
