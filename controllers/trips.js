const pool = require("../db");
const BadRequestError = require("../utils/errorclasses/BadRequestError");

const createTripWithPackingList = async (req, res, next) => {
    const {
        destination,
        when,
        activities,
    } = req.body;

    const user_id = req.user._id;

    if (!destination || !when) {
        return next(new BadRequestError("Destination and travel dates are required to create a trip."));
    }

    //Parse when with startData and endDate
    let startDate, endDate;
    let tripDateRange;

    //try block for dates
    try {
        const {startDate: reqStartDate, endDate: reqEndDate} = req.body;
        if (!reqStartDate || !reqEndDate) {
            return next(new BadRequestError("Detailed start and end dates are required."));
        }
        tripDateRange =  `[${new Date(reqStartDate).toISOString()}, ${new Date(reqEndDate).toISOString()}]`;
    } catch (parseError) {
        console.error("Error parsing dates: ", parseError);
        return next(new BadRequestError("Invalid date format provided for trip dates."));
    }

    //try block for packinglist
    try {
        await pool.query("Begin");

        //create packinglist
        const packingListName = `${destination} Trip Packing List`;
        const packingListResult = await pool.query(
            `INSERT INTO packing_lists (name, created_at, updated_at)
            VALUES ($1, NOW(), NOW())
            RETURNING id;`,
            [packingListName]
        );
        const packing_list_id = packingListResult.rows[0].id;

        //create new trip
        const tripResult = await pool.query(
            `INSERT INTO trips (
            destination,
            trip_date,
            packing_list_id,
            user_id,
            activities, 
            created_at,
            updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            RETURNING *;`,
            [
                destination,
                tripDateRange,
                packing_list_id,
                user_id,
                activities
            ]
        );

        await pool.query("COMMIT");

        //res with new trip details
        res.status(200).send({
            trip: tripResult.rows[0],
            packing_list: {id: packing_list_id, name: packingListName}
        });
    } catch (dbError) {
        await pool.query("ROLLBACK");
        console.error("Database error creating trip and packing list: ", dbError);
        return next(dbError);
    }
};

module.exports = {
    createTripWithPackingList,
};