const pool = require("../db");
const { created } = require("../utils/constants");

const BadRequestError = require("../utils/errorclasses/BadRequestError");
const UnauthorizedError = require("../utils/errorclasses/UnauthorizedError");

// const getClothingItems = async (req, res, next) => {
//   try {
//     const result = await pool.query(
//       "SELECT * FROM clothing_items ORDER BY created_at DESC;"
//     );
//     return res.send(result.rows);
//   } catch (err) {
//     return next(err);
//   }
// };


const createClothingItem = async (req, res, next) => {

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
    const result = await pool.query(
      `WITH deleted_item AS (
        SELECT id, owner
        FROM clothing_items
        WHERE id = $1
      )
      DELETE FROM clothing_items
      USING deleted_item
      WHERE clothing_items.id = deleted_item.id
      AND deleted_item.owner = $2
      RETURNING deleted_item.id, deleted_item.owner;`,
      [itemId, _id]
    );
    if (result.rowCount === 0) {
      return next(
        new UnauthorizedError(
          "You are not authorized to delete this item, or it doesn't exist."
        )
      );
    }
    return res.status(200).send({ message: "Deletion successful" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getClothingItems, createClothingItem, deleteClothingItem };