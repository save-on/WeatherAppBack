const pool = require("../db");
const { created } = require("../utils/constants");

const BadRequestError = require("../utils/errorclasses/BadRequestError");
const NotFoundError = require("../utils/errorclasses/NotFoundError");

const getClothingItems = async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM clothing_items");
    return res.send(rows);
  } catch (err) {
    return next(err);
  }
};

const createClothingItem = async (req, res, next) => {
  const { name, weather, affiliateLink, imagePath } = req.body;
  const { _id } = req.user;
  try {
    const [result] = await pool.query(
      "INSERT INTO clothing_items (name, weather_condition, owner, affiliate_link, isLiked, clothingimage_filepath) VALUES (?, ?, ?, ?, ?, ?)",
      [name, weather, _id, affiliateLink || null, false, imagePath || null]
    );

    return res.status(created).send({
      name,
      weather,
      affiliateLink,
      isLiked: false,
      owner: _id,
      item_id: result.insertId,
    });
  } catch (err) {
    return next(err);
  }
};

const deleteClothingItem = async (req, res, next) => {
  const { itemId } = req.params;
  const { _id } = req.user;
  if (!itemId) {
    return next(
      new BadRequestError(
        "Missing valid ItemId. The request could not be processed."
      )
    );
  }
  try {
    const [result] = await pool.query(
      "DELETE FROM clothing_items WHERE id = ? AND owner = ?",
      [itemId, _id]
    );
    if (result.affectedRows === 0) {
      return next(
        new NotFoundError("The request resource could not be found.")
      );
    }
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { getClothingItems, createClothingItem, deleteClothingItem };