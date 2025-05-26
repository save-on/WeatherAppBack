const pool = require("../db");
const BadRequestError = require("../utils/errorclasses/BadRequestError");
const UnauthorizedError = require("../utils/errorclasses/UnauthorizedError");
const NotFoundError = require("../utils/errorclasses/NotFoundError");

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

const deleteTripById = async (req, res) => {
  console.log("-> Entering deleteTripById controller.");
  const { tripId } = req.params;
  const userId = req.user._id; // Assuming req.user._id is populated by your auth middleware

  console.log("-> deleteTripById received req.params:", { tripId });
  console.log("-> deleteTripById received req.user:", { _id: userId });

  let client; // Declare client outside try-block for finally access
  try {
    if (!tripId) {
      return res.status(400).send({ message: "Trip ID is required." });
    }
    if (!userId) {
      // This should ideally be caught by auth middleware, but good for defensive coding
      return res.status(401).send({ message: "User not authenticated." });
    }

    client = await pool.connect(); // Acquire a client from the pool
    await client.query("BEGIN"); // Start a transaction

    // 1. Get the packing_list_id associated with the trip
    // This is the query that was previously causing the "column does not exist" error
    const getPackingListIdQuery =
      "SELECT packing_list_id FROM trips WHERE id = $1 AND user_id = $2;";
    const tripResult = await client.query(getPackingListIdQuery, [
      tripId,
      userId,
    ]);

    if (tripResult.rows.length === 0) {
      await client.query("ROLLBACK"); // Rollback if trip not found
      return res
        .status(404)
        .send({ message: "Trip not found or does not belong to user." });
    }

    const packingListId = tripResult.rows[0].packing_list_id;
    console.log(
      `-> Found packing_list_id: ${packingListId} for tripId: ${tripId}`
    );

    // 2. Delete entries in 'trip_activities' related to this trip
    // Assuming 'trip_activities' table has a 'trip_id' column
    const deleteTripActivitiesQuery =
      "DELETE FROM trip_activities WHERE trip_id = $1;";
    await client.query(deleteTripActivitiesQuery, [tripId]);
    console.log(`-> Deleted trip_activities for tripId: ${tripId}`);

    // 3. Delete items from 'packing_list_items' related to this packing list
    // Assuming 'packing_list_items' table has a 'packing_list_id' column
    const deletePackingListItemsQuery =
      "DELETE FROM packing_list_items WHERE packing_list_id = $1;";
    await client.query(deletePackingListItemsQuery, [packingListId]);
    console.log(
      `-> Deleted packing_list_items for packing_list_id: ${packingListId}`
    );

    // 4. Delete the packing list itself
    // Assuming 'packing_lists' table has an 'id' column
    const deletePackingListQuery = "DELETE FROM packing_lists WHERE id = $1;";
    await client.query(deletePackingListQuery, [packingListId]);
    console.log(`-> Deleted packing_list with ID: ${packingListId}`);

    // 5. Finally, delete the trip itself
    const deleteTripQuery = "DELETE FROM trips WHERE id = $1 AND user_id = $2;";
    await client.query(deleteTripQuery, [tripId, userId]);
    console.log(`-> Deleted trip with ID: ${tripId}`);

    await client.query("COMMIT"); // Commit the transaction
    console.log(
      `-> Successfully completed transaction for deleting trip ${tripId}.`
    );
    return res
      .status(200)
      .send({ message: "Trip and associated data deleted successfully." });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK"); // Rollback the transaction on error
      console.log(`-> Transaction rolled back for trip ${tripId}.`);
    }
    console.error("Error deleting trip by ID: ", error);
    // Determine the error message to send back to the frontend
    let errorMessage = "Failed to delete trip.";
    if (
      error.message &&
      error.message.includes('column "packing_list_id" does not exist')
    ) {
      errorMessage =
        "Database schema error: 'packing_list_id' column missing. Please check your database setup.";
    } else if (error.message) {
      errorMessage = error.message; // Use the raw error message if available
    }

    return res.status(500).send({ message: errorMessage });
  } finally {
    if (client) {
      client.release(); // Release the client back to the pool
      console.log("-> Database client released.");
    }
  }
};

module.exports = {
  createTripWithPackingList,
  getTrips,
  getTripById,
  deleteTripById,
};
