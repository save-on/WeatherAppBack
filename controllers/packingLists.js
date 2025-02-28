const pool = require("../db");
const { created } = require("../utils/constants");

const BadRequestError = require("../utils/errorclasses/BadRequestError");
const UnauthorizedError = require("../utils/errorclasses/UnauthorizedError");

const getPackingLists = async(req, res, next) => {
    try {
        const result = await pool.query(
            "SELECT * FROM packing_lists ORDER BY created_at DESC;"
        );
        return res.send(result.rows);
    } catch(err) {
        return next(err);
    }
} ;

const createPackingList = async (req, res, next) => {
    const { name, weather_condition, affiliate_link, clothing_image } = req.body;
    const { _id } = req.user;
    try {
        const result = await pool.query(
            `INSERT INTO packing_lists (
            name, 
            weather_condition,
            owner,
            clothing_image
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *;`,
            name, weather_condition, _id, clothing_image
        );
        return res.status(created).send(result.rows[0]);
    } catch (err) {
        return next(err);
    }
};

const deletePackingList = async (req, res, next) => {
    const { packingListId } = req.params;
    const { _id } = req.user;
    if (!packingListId) {
        return next(
            new BadRequestError(
                "Missing valid PackingListId. The request could not be processed."
            )
        );
    }
    try {
        const result = await pool.query(
            `WITH deleted_packingList AS (
            SELECT id, owner
            FROM packing_lists
            WHERE id = $1
            )
            DELETE FROM packing_lists
            USING deleted_packingList
            WHERE packing_lists.id = deleted_packingList.id
            AND delete_packingList.owner = $2
            RETURNING delteted_packingList.id, deleted_packingList.owner;`,
            [packingListId, _id]
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


module.exports = { getPackingLists, createPackingList, deletePackingList };