const pool = require("../db");
const path = require("path");
const crypto = require("crypto");
const fs = require('node:fs/promises');
const util = require('util');
const { created } = require("../utils/constants");

const BadRequestError = require("../utils/errorclasses/BadRequestError");
const UnauthorizedError = require("../utils/errorclasses/UnauthorizedError");

const getPackingLists = async (req, res, next) => {
  const owner_id = req.user._id; //Getting user id from auth middleware
  try {
    const result = await pool.query(
      "SELECT * FROM packing_lists WHERE owner = $1 ORDER BY created_at DESC;",
      [owner_id]
    );
    return res.send(result.rows);
  } catch (err) {
    return next(err);
  }
};

const getPackingListById = async (req, res, next) => {
  const { packingListId } = req.params;
  const owner_id = req.user._id;
  try {
    // Fetching packing list details
    const packingListResult = await pool.query(
      "SELECT * FROM packing_lists WHERE id = $1 AND owner = $2",
      [packingListId, owner_id]
    );
    if (packingListResult.rows.length === 0) {
      return next(
        new BadRequestError("Packing list not found or you are not authorized")
      );
    }
    const packingList = packingListResult.rows[0];

    // Fetching items in the packing list
    const itemsResult = await pool.query(
      `SELECT pli.id AS packing_list_item_id,
            pli.quatity, 
            pli.notes,
            ci.*
            FROM packing_list_items pli
            JOIN clothing_items ci ON pli.clothing_item_id = ci.id
            WHERE pli.packing_list_id = $1`,
      [packingListId]
    );
    packingListResult.items = itemsResult.rows;

    return res.send(packingList);
  } catch (err) {
    return next(err);
  }
};

const createPackingList = async (req, res, next) => {
    const { name, weather_condition, location } = req.body;
    const owner_id = req.user._id;
    const imageFile = req.file;

    if (!name) {
        return next(new BadRequestError("Packing list name is required."));
    }

    let image_filepath;
    if (imageFile) {
        image_filepath = `/uploads/${req.file.filename}`; // Simplified file path, like clothing items
        console.log("Simplified image_filepath: ", image_filepath); // Log the simplified path
    }

    try {
        const result = await pool.query(
            `INSERT INTO packing_lists (
                name,
                owner,
                image_filepath
                )
                VALUES ($1, $2, $3)
                RETURNING *;`,
            [name, owner_id, image_filepath]
        );
        return res.status(201).send(result.rows[0]);
    } catch (dbError) {
        console.error("Database error: ", dbError);
        return next(dbError);
    }
};

const updatePackingList = async (req, res, next) => {
  const { packingListId } = req.params;
  const { name } = req.body;
  const owner_id = req.user._id;
  if (!name) {
    return next(
      new BadRequestError("Packing list name is required for update.")
    );
  }
  try {
    const result = await pool.query(
      "UPDATE packing_lists SET name = $1, updated_at = now() WHERE id = $2 AND owner = $3 RETURNING *;",
      [name, packingListId, owner_id]
    );
    if (result.rows.length === 0) {
      return next(
        new UnauthorizedError("Not authorized to update this packing list.")
      );
    }
    return res.send(result.rows[0]);
  } catch (err) {
    return next(err);
  }
};

const deletePackingList = async (req, res, next) => {
  const { packingListId } = req.params;
  const owner_id = req.user._id;
  try {
    const result = await pool.query(
      "DELETE FROM packing_lists WHERE id = $1 AND owner = $2 RETURNING *;",
      [packingListId, owner_id]
    );
    if (result.rows.length === 0) {
      return next(
        new UnauthorizedError("Not authorized to delete this packing list.")
      );
    }
    return res
      .status(200)
      .send({ message: "Packing list deleted successfully." });
  } catch (err) {
    next(err);
  }
};

const addItemToPackingList = async (req, res, next) => {
  const { packingListId } = req.params;
  const { clothing_item_id } = req.body;
  if (!clothing_item_id) {
    return next(
      new BaseAudioContext("clothing_item_id is required to add item.")
    );
  }
  try {
    // Checking if packing list exists and belongs to the user.
    // Checking if clothing items exists.
    const result = await pool.query(
      "INSERT INTO packing_list_items (packing_list_id, clothing_item_id) VALUES ($1, $2) RETURNING *;",
      [packingListId, clothing_item_id]
    );
    return res.status(201).send(result.rows[0]);
  } catch (err) {
    return next(err);
  }
};

const removeItemFromPackingList = async (req, res, next) => {
  const { packingListId, itemId } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM packing_list_items WHERE id = $1 AND packing_list_id = $2 RETURNING *;",
      [itemId, packingListId]
    );
    if (result.rows.length === 0) {
      return next(
        new BadRequestError(
          "Packing list item not found or not in this packing list."
        )
      );
    }
    return res.send({ message: "Item removed from packing list." });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getPackingLists,
  getPackingListById,
  createPackingList,
  updatePackingList,
  deletePackingList,
  addItemToPackingList,
  removeItemFromPackingList,
};
