const pool = require("../db");
const BadRequestError = require("../utils/errorclasses/BadRequestError");

const createTripWithPackingList = async (req, res, next) => {
    const {
        destination,
        when,
        activities: activitiesString,
    } = req.body;

    const user_id = req.user._id;

    if (!destination || !req.body.startDate || !req.body.endDate) {
        return next(new BadRequestError("Destination and travel dates are required to create a trip."));
    }

    //Parse when with startData and endDate
    let startDate, endDate;
    let tripDateRange;

    //try block for dates
    try {
        const {startDate: reqStartDate, endDate: reqEndDate} = req.body;
        tripDateRange= `[${new Date(reqStartDate).toISOString()}, ${new Date(reqendDate).toISOString()}]`;
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
            created_at,
            updated_at
            )
            VALUES ($1, $2, $3, $4, NOW(), NOW()) 
            RETURNING *;`,
            [
                destination,
                tripDateRange,
                packing_list_id,
                user_id,
            ]
        );
        const trip_id = tripResult.rows[0].id;

        //handle activities
        const activitiesArray = activitiesString 
        ? activitiesString.split(',').map(activity => activity.trim()).filter(Boolean)
        : [];

        for (const activityName of activitiesArray) {
            let activity_id;

            //check if activity exists
            const existingActivity = await pool.query(
                `SELECT id FROM activities WHERE activity = $1;`,
                [activityName]
            );

            if (existingActivity.rows.length > 0) {
                activity_id = existingActivity.rows[0].id;
            } else {
                //add new activity
                const newActivityResult = await pool.query(
                    `INSERT INTO activities (activity) VALUES ($1) RETURNING id;`,
                    [activityName]
                );
                activity_id = newActivityResult.rows[0].id;
            }

            //link trip and activities to trip_activities junction table
            await pool.query(
                `INSERT INTO trip_activities (trip_id, activity_id) VALUES ($1, $2) ON CONFLICT (trip_id, activity_id) DO NOTHING;`,
                [trip_id, activity_id]
            );
        }

        await pool.query("COMMIT");

        //res with new trip details
        res.status(201).send({
            trip: tripResult.rows[0],
            packing_list: {id: packing_list_id, name: packingListName},
            activities: activitiesArray,
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