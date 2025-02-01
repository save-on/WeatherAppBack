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
