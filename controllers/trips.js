const pool = require("../db");
const BadRequestError = require("../utils/errorclasses/BadRequestError");
const UnauthorizedError = require("../utils/errorclasses/UnauthorizedError");
const NotFoundError = require("../utils/errorclasses/NotFoundError");

const createTripWithPackingList = async (req, res, next) => {
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
    console.log("Starting DB Transaction (Begin).");
    await pool.query("Begin");
    console.log("Transaction Began.");

    //create packinglist
    const packingListName = `${destination} Trip Packing List`;
    console.log("Attempting to insert packing list.");
    const packingListResult = await pool.query(
      `INSERT INTO packing_lists (name, created_at, updated_at)
            VALUES ($1, NOW(), NOW())
            RETURNING id;`,
      [packingListName]
    );
    const packing_list_id = packingListResult.rows[0].id;
    console.log("Packing list inserted, ID:", packing_list_id);

    //create new trip
    console.log("Attempting to insert trip.");
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
    console.log("Trip inserted, ID:", trip_id);

    //handle activities
    console.log("Processing activities:", activitiesArray);
    for (const activityName of activitiesArray) {
      let activityId;

      // 1. Check if activity already exists in 'activities' table
      const existingActivity = await pool.query(
        `SELECT id FROM activities WHERE activity = $1;`,
        [activityName]
      );

      if (existingActivity.rows.length > 0) {
        activityId = existingActivity.rows[0].id; // Activity exists, get its ID
        console.log(
          `Activity "${activityName}" already exists with ID: ${activityId}`
        );
      } else {
        // 2. If not, insert new activity into 'activities' table
        const newActivityResult = await pool.query(
          `INSERT INTO activities (activity) VALUES ($1) RETURNING id;`,
          [activityName]
        );
        activityId = newActivityResult.rows[0].id;
        console.log(
          `New activity "${activityName}" inserted with ID: ${activityId}`
        );
      }

      // 3. Link activity to the trip in 'trip_activities' junction table
      await pool.query(
        `INSERT INTO trip_activities (trip_id, activity_id) VALUES ($1, $2)
         ON CONFLICT (trip_id, activity_id) DO NOTHING;`,
        [trip_id, activityId]
      );
      console.log(
        `Linked trip_id ${trip_id} with activity_id ${activityId} in trip_activities.`
      );

      console.log(`Processed activity: ${activityName}`);
      console.log(`Processed activity: ${activityName}`);
    }
    console.log("All activities processed.");

    console.log("Attempting to COMMIT transaction.");
    await pool.query("COMMIT");
    console.log("Transaction COMMITTED.");

    res.status(201).send({
      trip: tripResult.rows[0],
      packing_list: { id: packing_list_id, name: packingListName },
      activities: activitiesArray,
    });
    console.log("Response sent from controller successfully.");
  } catch (dbError) {
    console.error("DATABASE ERROR CAUGHT IN TRIPS CONTROLLER:", dbError);

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
  try {
    const { tripId } = req.params;
    const userId = req.user._id;

    if (!tripId) {
      return next(new BadRequestError("Trip ID is required."));
    }

    //1. fetch trip details and activities
    const result = await pool.query(
      `SELECT
          t.id,
          t.destination,
          t.trip_date,
          t.packing_list_id,
          t.user_id,
          t.created_at,
          t.updated_at,
          COALESCE(ARRAY_AGG(a.activity) FILTER (WHERE a.activity IS NOT NULL), '{}') AS activities
       FROM
          trips t
       LEFT JOIN -- Use LEFT JOIN to ensure the trip is returned even if it has no activities
          trip_activities ta ON t.id = ta.trip_id
       LEFT JOIN
          activities a ON ta.activity_id = a.id
       WHERE
          t.id = $1 AND t.user_id = $2
       GROUP BY -- Group by all columns from the 'trips' table to use ARRAY_AGG
          t.id, t.destination, t.trip_date, t.packing_list_id, t.user_id, t.created_at, t.updated_at;`,
      [tripId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Trip not found." });
    }

    const trip = result.rows[0];
    const packingListId = trip.packing_list_id;

    //Initialize packing list structure for frontend
    let packingListItems = {
      clothes: [],
      footwear: [],
      accessories: [],
      personal_items: [],
    };

    //2. if packing list exists fetch its items
    if (packingListId) {
      const itemsResult = await pool.query(
        `SELECT
            name,
            quantity,
            is_checked,
            category
         FROM
            packing_list_items
         WHERE
            packing_list_id = $1
         ORDER BY id;`, // Optional: add an order by clause if you want consistent order
        [packingListId]
      );

      //3. process items and group by category
      itemsResult.rows.forEach((item) => {
        if (packingListItems.hasOwnProperty(item.category)) {
          packingListItems[item.category].push({
            name: item.name,
            quantity: item.quantity,
            isChecked: item.is_checked,
            isEmpty: false,
          });
        } else {
          console.warn(
            `Unrecognized packing list item category: ${item.category} for item ${item.name}`
          );
        }
      });
    }

    //4. Combine trip data and packing list
    const fullTripData = {
      ...trip,
      packingList: packingListItems,
    };
    res.status(200).json({ trip: fullTripData });
  } catch (error) {
    console.error("Error fetching trip by ID: ", error);
    next(error);
  }
};

const deleteTripById = async (req, res) => {
  const { tripId } = req.params;
  const userId = req.user._id;

  let client;
  try {
    if (!tripId) {
      return res.status(400).send({ message: "Trip ID is required." });
    }
    if (!userId) {
      return res.status(401).send({ message: "User not authenticated." });
    }

    client = await pool.connect(); // Acquire a client from the pool
    await client.query("BEGIN"); // Start a transaction

    // 1. Get the packing_list_id associated with the trip

    const getPackingListIdQuery =
      "SELECT packing_list_id FROM trips WHERE id = $1 AND user_id = $2;";
    const tripResult = await client.query(getPackingListIdQuery, [
      tripId,
      userId,
    ]);

    if (tripResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .send({ message: "Trip not found or does not belong to user." });
    }

    const packingListId = tripResult.rows[0].packing_list_id;
    console.log(
      `-> Found packing_list_id: ${packingListId} for tripId: ${tripId}`
    );

    // 2. Delete entries in 'trip_activities' related to this trip
    const deleteTripActivitiesQuery =
      "DELETE FROM trip_activities WHERE trip_id = $1;";
    await client.query(deleteTripActivitiesQuery, [tripId]);
    console.log(`-> Deleted trip_activities for tripId: ${tripId}`);

    // 3. Delete items from 'packing_list_items' related to this packing list
    const deletePackingListItemsQuery =
      "DELETE FROM packing_list_items WHERE packing_list_id = $1;";
    await client.query(deletePackingListItemsQuery, [packingListId]);
    console.log(
      `-> Deleted packing_list_items for packing_list_id: ${packingListId}`
    );

    // 4. Delete the packing list itself
    const deletePackingListQuery = "DELETE FROM packing_lists WHERE id = $1;";
    await client.query(deletePackingListQuery, [packingListId]);
    console.log(`-> Deleted packing_list with ID: ${packingListId}`);

    // 5. Finally, delete the trip itself
    const deleteTripQuery = "DELETE FROM trips WHERE id = $1 AND user_id = $2;";
    await client.query(deleteTripQuery, [tripId, userId]);
    console.log(`-> Deleted trip with ID: ${tripId}`);

    await client.query("COMMIT");
    console.log(
      `-> Successfully completed transaction for deleting trip ${tripId}.`
    );
    return res
      .status(200)
      .send({ message: "Trip and associated data deleted successfully." });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
      console.log(`-> Transaction rolled back for trip ${tripId}.`);
    }
    console.error("Error deleting trip by ID: ", error);
    let errorMessage = "Failed to delete trip.";
    if (
      error.message &&
      error.message.includes('column "packing_list_id" does not exist')
    ) {
      errorMessage =
        "Database schema error: 'packing_list_id' column missing. Please check your database setup.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return res.status(500).send({ message: errorMessage });
  } finally {
    if (client) {
      client.release();
      console.log("-> Database client released.");
    }
  }
};

const updateTrip = async (req, res, next) => {
  console.log("-> Entering updateTrip controller.");
  console.log("-> updateTrip received req.params:", req.params);
  console.log("-> updateTrip received req.body:", req.body);

  const { tripId } = req.params;
  const userId = req.user._id;

  const { destination, startDate, endDate, activities, packingList } = req.body;

  let client;

  try {
    if (!tripId) {
      return next(new BadRequestError("Trip ID is required for update."));
    }
    if (!userId) {
      return next(new BadRequestError("User not authenticated."));
    }

    client = await pool.connect();
    await client.query("BEGIN");

    //1. Verify trip existance and ownership, and get packing_list_id
    const tripCheckResult = await client.query(
      `SELECT packing_list_id FROM trips WHERE id = $1 AND user_id = $2;`,
      [tripId, userId]
    );
    if (tripCheckResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return next(
        new NotFoundError("Trip not found or does not belong to user.")
      );
    }
    const packing_list_id = tripCheckResult.rows[0].packing_list_id;

    //2. update 'trips' table
    let updateTripQuery = `UPDATE trips SET updated_at = NOW()`;
    const updateTripParams = [];
    let paramIndex = 1;

    if (destination !== undefined) {
      updateTripQuery += `, destination = $${paramIndex}`;
      updateTripParams.push(destination);
      paramIndex++;
    }

    let tripDateRange;
    if (startDate !== undefined && endDate !== undefined) {
      try {
        tripDateRange = `[${new Date(startDate).toISOString()}, ${new Date(
          endDate
        ).toISOString()}]`;
        updateTripQuery += `, trip_date = $${paramIndex}`;
        updateTripParams.push(tripDateRange);
        paramIndex++;
      } catch (parseError) {
        console.error("Error parsing dates for update: ", parseError);
        await client.query("ROLLBACK");
        return next(
          new BadRequestError("Invalid date format provided for trip dates.")
        );
      }
    }

    updateTripQuery += ` WHERE id = $${paramIndex} AND user_id = $${
      paramIndex + 1
    } RETURNING *;`;
    updateTripParams.push(tripId, userId);

    const updatedTripResult = await client.query(
      updateTripQuery,
      updateTripParams
    );
    console.log("--> Trips table updated for trip ID: ", tripId);

    //3. handle activities update, deleting all existing and re-insert new activities
    //   deleting existing activities for this trip from junction table as well
    await client.query(`DELETE FROM trip_activities WHERE trip_id = $1;`, [
      tripId,
    ]);
    console.log("--> Deleted existing trip_activities for trip ID: ", tripId);

    if (activities && activities.length > 0) {
      for (const activityName of activities) {
        let activityId;
        const existingActivity = await client.query(
          `SELECT id FROM activities WHERE activity = $1;`,
          [activityName]
        );

        if (existingActivity.rows.length > 0) {
          activityId = existingActivity.rows[0].id;
        } else {
          //insert new activity
          const newActivityResult = await client.query(
            `INSERT INTO activities (activity) VALUES ($1) RETURNING id;`,
            [activityName]
          );
          activityId = newActivityResult.rows[0].id;
        }
        // link activity to trip in trip_activities junction table
        await client.query(
          `INSERT INTO trip_activities (trip_id, activity_id) VALUES ($1, $2);`,
          [tripId, activityId]
        );
      }
      console.log("--> Re-inserted new trip_activities for trip ID: ", tripId);
    } else {
      console.log(
        "--> No activities provided for update or activities array is empty."
      );
    }

    //4. handle packing List Items Update, deleting all existing and re-insert new ones
    await client.query(
      `DELETE FROM packing_list_items WHERE packing_list_id = $1;`,
      [packing_list_id]
    );
    console.log(
      "--> Deleted existing packing_list_items for packing list ID: ",
      packing_list_id
    );

    if (packingList) {
      const categories = Object.keys(packingList); // ['clothes', 'footwear', ...]
      for (const category of categories) {
        if (
          Array.isArray(packingList[category]) &&
          packingList[category].length > 0
        ) {
          for (const item of packingList[category]) {
            // Note: packing_list_items schema has activity_id INT NULL,
            // but for general packing items, it will be NULL.
            // Adjust if you store specific activity-related items here.
            await client.query(
              `INSERT INTO packing_list_items (packing_list_id, name, category, quantity, is_checked) VALUES ($1, $2, $3, $4, $5);`,
              [
                packing_list_id,
                item.name,
                category,
                item.quantity,
                item.isChecked || false,
              ]
            );
          }
        }
      }
      console.log(
        "-> Re-inserted new packing_list_items for packing list ID:",
        packing_list_id
      );
    } else {
      console.log("-> No packingList provided for update.");
    }

    await client.query("COMMIT");
    console.log("--> Transaction COMMITTED for updateTrip.");

    const fullUpdatedTrip = await client.query(
      `SELECT
          t.id,
          t.destination,
          t.trip_date,
          t.packing_list_id,
          t.user_id,
          t.created_at,
          t.updated_at,
          COALESCE(ARRAY_AGG(a.activity) FILTER (WHERE a.activity IS NOT NULL), '{}') AS activities
       FROM
          trips t
       LEFT JOIN
          trip_activities ta ON t.id = ta.trip_id
       LEFT JOIN
          activities a ON ta.activity_id = a.id
       WHERE
          t.id = $1 AND t.user_id = $2
       GROUP BY
          t.id, t.destination, t.trip_date, t.packing_list_id, t.user_id, t.created_at, t.updated_at;`,
      [tripId, userId]
    );

    const packingListItems = await client.query(
      `SELECT id, name, category, quantity, is_checked FROM packing_list_items WHERE packing_list_id = $1;`,
      [packing_list_id]
    );

    const formattedPackingList = {
      clothes: packingListItems.rows.filter(
        (item) => item.category === "clothes"
      ),
      footwear: packingListItems.rows.filter(
        (item) => item.category === "footwear"
      ),
      accessories: packingListItems.rows.filter(
        (item) => item.category === "accessories"
      ),
      personal_items: packingListItems.rows.filter(
        (item) => item.category === "personal_items"
      ),
    };

    if (fullUpdatedTrip.rows.length === 0) {
      return res
        .status(500)
        .json({ message: "Failed to retrieve updated trip data." });
    }

    res.status(200).json({
      message: "Trip updated successfully",
      trip: {
        ...fullUpdatedTrip.rows[0],
        packingList: formattedPackingList,
      },
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
      console.error(
        "--> Transction rolled back for updateTrip due to error: ",
        error
      );
    }
    console.error("Error updating trip by ID: ", error);
    next(error);
  } finally {
    if (client) {
      client.release();
      console.log("--> Database client released for updateTrip.");
    }
  }
};

module.exports = {
  createTripWithPackingList,
  getTrips,
  getTripById,
  deleteTripById,
  updateTrip,
};
