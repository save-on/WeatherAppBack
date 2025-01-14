const bcrypt = require("bcryptjs");
const pool = require("../db");

const findUserByCredentials = async ({ email, password }) => {
  try {
    const [row] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (row.length === 0) {
      throw new Error("Incorrect email or password");
    }
    const user = row[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new Error("Incorrect email or password");
    }
    return user;
  } catch (err) {
    throw err;
  }
};

module.exports = { findUserByCredentials };
