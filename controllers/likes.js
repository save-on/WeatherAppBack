const pool = require("../db");
const BadRequestError = require("../utils/errorclasses/BadRequestError");
const UnauthorizedError = require("../utils/errorclasses/UnauthorizedError");
const NotFoundError = require("../utils/errorclasses/NotFoundError");

const likeItem = async (req, res, next) => {
  const { _id } = req.user;
  const { itemId } = req.params;
  if (!_id) {
    return next(
      new UnauthorizedError(
        "You are not authorized to interact with this item."
      )
    );
  }
  if (!itemId) {
    return next(
      new BadRequestError(
        "Missing valid itemId. The request could not be processed."
      )
    );
  }
  try {
    const result = await pool.query(
      `UPDATE clothing_items
      SET likes = CASE
        WHEN $1 = ANY(likes) THEN likes
        ELSE array_append(likes, $1)
      END
      WHERE id = $2
      RETURNING *;
      `,
      [_id, itemId]
    );
    if (result.rowCount === 0) {
      return next(
        new NotFoundError("The requested resource could not be found.")
      );
    }
    return res.status(200).send(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const dislikeItem = async (req, res, next) => {
  const { _id } = req.user;
  const { itemId } = req.params;
  if (!_id) {
    return next(
      new UnauthorizedError(
        "You are not authorized to interact with this item."
      )
    );
  }
  if (!itemId) {
    return next(
      new BadRequestError(
        "Missing valid itemId. The request could not be processed."
      )
    );
  }
  try {
    const result = await pool.query(
      `UPDATE clothing_items
      SET likes = array_remove(likes, $1)
      WHERE id = $2
      RETURNING *;`,
      [_id, itemId]
    );
    if (result.rowCount === 0) {
      return next(
        new NotFoundError("The requested resource could not be found.")
      );
    }
    return res.status(200).send(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  likeItem,
  dislikeItem,
};
