const bcrypt = require("bcryptjs");
const pool = require("../db");
const jwt = require("jsonwebtoken");
const { created } = require("../utils/constants");
const { findUserByCredentials } = require("../models/userModels");

const BadRequestError = require("../utils/errorclasses/BadRequestError");
const UnauthorizedError = require("../utils/errorclasses/UnauthorizedError");
const ForbiddenError = require("../utils/errorclasses/ForbiddenError");
const NotFoundError = require("../utils/errorclasses/NotFoundError");

const createUser = async (req, res, next) => {
  const { name, avatar, email, password, location } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (name, email, image_filepath, password, location, allow_location) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, avatar || null, hashedPassword, location || null, false]
    );
    return res.status(created).send({ message: "Account creation successful" });
  } catch (err) {
    return next(err);
  }
};

const signInUser = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(
      new BadRequestError(
        "Invalid input data. The request could not be processed."
      )
    );
  }
  try {
    const user = await findUserByCredentials({ email, password });
    if (!user) {
      return next(new UnauthorizedError("Unauthorized, invalid credentials"));
    }
    const { id, name, image_filepath, location } = user;
    const token = await jwt.sign({ _id: id }, process.env.JWT_TOKEN, {
      expiresIn: "7d",
    });
    res.status(200).send({
      token,
      name,
      _id: id,
      avatar: image_filepath,
      location,
    });
  } catch (err) {
    if (err.message === "Incorrect email or password") {
      return next(new UnauthorizedError("Unauthorized, invalid credentials."));
    }
    return next(err);
  }
};

const getCurrentUser = async (req, res, next) => {
  const { _id } = req.user;
  try {
    const [result] = await pool.query("SELECT * FROM users WHERE id = ?", [
      _id,
    ]);
    console.log(result);
    const { id, name, image_filepath, location } = result[0];
    return res.send({
      _id: id,
      name,
      avatar: image_filepath,
      location,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const updateCurrentUser = async (req, res, next) => {
  const { _id } = req.user;
  const { name, avatar } = req.body;
  if (!_id) {
    return next(
      new ForbiddenError("You do not have permission to edit user info.")
    );
  }
  try {
    const [result] = await pool.query(
      "UPDATE users SET name = ?, image_filepath = ? WHERE id = ?",
      [name, avatar, _id]
    );
    if (result.affectedRows === 0) {
      return next(
        new NotFoundError(
          "The user you attempted to update could not be found."
        )
      );
    }
    return res.status(200).send({
      _id,
      name,
      avatar,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { createUser, signInUser, getCurrentUser, updateCurrentUser };
