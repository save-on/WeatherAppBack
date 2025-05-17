const pool = require("../db");
const db = require("../db");

// Create packinglists
const createPackingList = async (req, res, next) => {
  const { destination, trip_date } = req.body;

  try {
    const packingListResult = await pool.query(
      `INSERT INTO packing_lists (
      name
      )
      VALUES ($1) RETURNING *;`,
      [destination]
    );
    const { id } = packingListResult.rows[0];
    const tripsResult = await pool.query(
      `INSERT INTO trips (
      destination,
      trip_date,
      packing_list_id,
      user_id
      )
      VALUES ($1, daterange($2, $3), $4, $5);`,
      [destination, trip_date[0], trip_date[1], id, 1]
    );
    return res.status(201).send(tripsResult.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Delete packinglists
const deletePackingList = async (req, res, next) => {
  const { packing_id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM packing_lists
      WHERE id = $1;
      `,
      [packing_id]
    );
    return res.status(204);
  } catch (err) {
    next(err);
  }
};

// Update packinglists
const updatePackingList = async (req, res, next) => {
  const { name } = req.body;
  const { packing_id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE packing_lists
      SET name = $1
      WHERE id = $2 RETURNING *;`,
      [name, packing_id]
    );
    console.log(result);
    return res.status(200).send(result.rows[0]);
  } catch (err) {
    next(err);
  }
};
// Create packinglists_items
const createPackingListItem = async (req, res, next) => {
  const { packing_id } = req.params;
  const {} = req.body;
};

// Delete packinglists_items
// Update packinglists_items
// Read packinglists_items

module.exports = {
  createPackingList,
  deletePackingList,
  updatePackingList,
  createPackingListItem,
};
