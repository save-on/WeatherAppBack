const pool = require("../db");
const BadRequestError = require("../utils/errorclasses/BadRequestError");

const createTripWithPackingList = async (req, res, next) => {
  console.log("Reached createTripWithPackingList controller.");
  console.log("Request Body received in controller: ", req.body);
  const { destination, when, activities: activitiesString } = req.body;

  const user_id = req.user._id;

  if (!destination || !req.body.startDate || !req.body.endDate) {
    return next(
      new BadRequestError(
        "Destination and travel dates are required to create a trip."
      )
    );
  }

  //Parse when with startData and endDate
  let startDate, endDate;
  let tripDateRange;

  //try block for dates
  try {
    const { startDate: reqStartDate, endDate: reqEndDate } = req.body;
    tripDateRange = `[${new Date(reqStartDate).toISOString()}, ${new Date(
      reqEndDate
    ).toISOString()}]`;
  } catch (parseError) {
    console.error("Error parsing dates: ", parseError);
    return next(
      new BadRequestError("Invalid date format provided for trip dates.")
    );
  }

  const activitiesArray = activitiesString
    ? activitiesString
        .split(",")
        .map((activity) => activity.trim())
        .filter(Boolean)
    : [];

  //try block for packinglist
  try {
    console.log("Starting DB Transaction (Begin)."); // NEW
    await pool.query("Begin");
    console.log("Transaction Began."); // NEW

    //create packinglist
    const packingListName = `${destination} Trip Packing List`;
    console.log("Attempting to insert packing list."); // NEW
    const packingListResult = await pool.query(
      `INSERT INTO packing_lists (name, created_at, updated_at)
            VALUES ($1, NOW(), NOW())
            RETURNING id;`,
      [packingListName]
    );
    const packing_list_id = packingListResult.rows[0].id;
    console.log("Packing list inserted, ID:", packing_list_id); // NEW

    //create new trip
    console.log("Attempting to insert trip."); // NEW
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
      [destination, tripDateRange, packing_list_id, user_id]
    );
    const trip_id = tripResult.rows[0].id;
    console.log("Trip inserted, ID:", trip_id); // NEW

    //handle activities
    console.log("Processing activities:", activitiesArray); // NEW
    for (const activityName of activitiesArray) {
      // ... (activity check/insert/link) ...
      console.log(`Processed activity: ${activityName}`); // NEW
    }
    console.log("All activities processed."); // NEW

    console.log("Attempting to COMMIT transaction."); // NEW
    await pool.query("COMMIT");
    console.log("Transaction COMMITTED."); // NEW

    res.status(201).send({
      trip: tripResult.rows[0],
      packing_list: { id: packing_list_id, name: packingListName },
      activities: activitiesArray,
    });
    console.log("Response sent from controller successfully."); // NEW
  } catch (dbError) {
    console.error("DATABASE ERROR CAUGHT IN TRIPS CONTROLLER:", dbError); // This is the crucial log
    // Add a log for rollback as well
    await pool.query("ROLLBACK");
    console.error("Database transaction rolled back due to error.");
    return next(dbError);
  }
};

const getTrips = async (req, res, next) => {
  try {
    const userId = req.user._id;

    //look for trips for the user
    const result = await pool.query(
      `SELECT id, destination, trip_date, packing_list_id, user_id, created_at, updated_at 
            FROM trips 
            WHERE user_id = $1 
            ORDER BY created_at DESC;`,
      [userId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching trips: ", error);
    next(error);
  }
};

const getTripById = async (req, res, next) => {
    console.log("-> Entering getTripById controller."); 
  console.log("-> getTripById received req.params:", req.params); 
  console.log("-> getTripById received req.user:", req.user);

  try {
    const { tripId } = req.params;
    const userId = req.user._id;

    if (!tripId) {
      return next(new BadRequestError("Trip ID is requried."));
    }

    const result = await pool.query(
      `SELECT id, destination, trip_date, packing_list_id, user_id, created_at, updated_at 
            FROM trips 
            WHERE id = $1 AND user_id = $2;`,
      [tripId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Trip not found." });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching trip by ID: ", error);
    next(error);
  }
};

module.exports = {
  createTripWithPackingList,
  getTrips,
  getTripById,
};
