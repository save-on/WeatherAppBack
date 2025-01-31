const bcrypt = require("bcryptjs");
const pool = require("../db");

const findUserByCredentials = async ({ email, password }) => {
  try {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1;`, [
      email,
    ]);
    const { rows } = result;
    if (rows.length === 0) {
      throw new Error("Incorrect email or password");
    }
    const match = await bcrypt.compare(password, rows[0].password);
    if (!match) {
      throw new Error("Incorrect email or password");
    }
    return rows[0];
  } catch (err) {
    console.error(err);
  }
};

module.exports = { findUserByCredentials };
