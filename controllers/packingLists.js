const pool = require("../db");
const db = require("../db");
const nodemailer = require("nodemailer");
const UserModal = require("../models/userModels");

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

const getItemsForPackingList = async (req, res, next) => {
  try {
    const packingListId = req.params.packingListId;
    const query = `
      SELECT
      clothing_items.id AS clothing_item_id,
      clothing_items.name AS clothing_item_name,
      clothing_items.clothing_image AS clothing_image,
      clothing_items.weather_condition AS clothing_weather_condition,
      clothing_items.affiliate_link AS clothing_affiliate_link,
      clothing_items.created_at AS clothing_created_at,
      clothing_items.owner AS clothing_owner
      FROM clothing_items
      INNER JOIN packing_list_items  
      ON clothing_items.id = packing_list_items.clothing_item_id
      WHERE packing_list_items.packing_list_id = $1
      `;

    const values = [packingListId];
    const result = await db.query(query, values);
    const items = result.rows;

    if (!items || items.length === 0) {
      return res
        .status(404)
        .json({ message: "No items found for this packing list" });
    }
    res.status(200).json(items);
  } catch (err) {
    next(err);
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

  let packinglist_image;
  if (imageFile) {
    packinglist_image = `uploads/${req.file.filename}`; // Simplified file path, like clothing items
  }

  try {
    const result = await pool.query(
      `INSERT INTO packing_lists (
                name,
                owner,
                packinglist_image,
                weather_condition
                )
                VALUES ($1, $2, $3, $4)
                RETURNING *;`,
      [name, owner_id, packinglist_image, weather_condition]
    );
    return res.status(201).send(result.rows[0]);
  } catch (dbError) {
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
  const { clothing_item_ids } = req.body;

  if (
    !clothing_item_ids ||
    !Array.isArray(clothing_item_ids) ||
    clothing_item_ids.length === 0
  ) {
    return next(
      new BadRequestError(
        "clothing_item_ids are required and must be a non-empty array to add items."
      )
    );
  }

  try {
    for (const clothing_item_id of clothing_item_ids) {
      await pool.query(
        "INSERT INTO packing_list_items (packing_list_id, clothing_item_id) VALUES ($1, $2);",
        [packingListId, clothing_item_id]
      );
    }

    return res
      .status(201)
      .send({ message: "Items added to packing list successfully." });
  } catch (err) {
    return next(err);
  }
};

const removeItemFromPackingList = async (req, res, next) => {
  const { packingListId, itemId } = req.params;
  const userId = req.user._id;

  try {
    const authCheck = await pool.query(
      "SELECT 1 FROM packing_lists WHERE id = $1 AND owner = $2;",
      [packingListId, userId]
    );

    if (authCheck.rows.length === 0) {
      return next(
        new UnauthorizedError(
          "You are not authorized to modify this packing list."
        )
      );
    }
    const result = await pool.query(
      "DELETE FROM packing_list_items WHERE packing_list_id = $1 AND clothing_item_id = $2 RETURNING *;",
      [packingListId, itemId]
    );

    if (result.rows.length === 0) {
      return next(
        new BadRequestError(
          "Packing list item not found or not in this packing list."
        )
      );
    }
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};

const sendPackingListEmail = async (req, res) => {
  console.log("Received request to send packing list email.");

  const {
    clothes,
    footwear,
    accessories,
    personal_items,
    tripName,
    tripDates,
  } = req.body;

  const userId = req.user._id;

  const packingList = {
    clothes: clothes || [],
    footwear: footwear || [],
    accessories: accessories || [],
    personal_items: personal_items || [],
  };

  if (!clothes && !footwear && !accessories && !personal) {
    return res.status(400).send({
      message: "Packing list content (clothes, footwear, etc.) is required.",
    });
  }

  try {
    const userResult = await pool.query(
      "SELECT email FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].email) {
      console.error(
        "User not found or email not available for user ID:",
        userId
      );
      return res
        .status(404)
        .send({ message: "User not found or email unavailable." });
    }
    const recipientEmail = userResult.rows[0].email; // Access email from the query result

    let emailContent = `
            <h1>Your Packing List for ${tripName || "Your Trip"}</h1>
            ${tripDates ? `<p>Dates: ${tripDates}</p>` : ""}
            <p>Here's your organized packing list:</p>
        `;

    // Add Clothes
    if (packingList.clothes && packingList.clothes.length > 0) {
      const filteredClothes = packingList.clothes.filter(
        (item) => !item.isEmpty && item.quantity > 0
      );
      if (filteredClothes.length > 0) {
        emailContent += "<h2>Clothes</h2><ul>";
        filteredClothes.forEach((item) => {
          emailContent += `<li>${item.name} (Quantity: ${item.quantity}) ${
            item.isChecked ? "(Packed)" : "(Not Packed)"
          }</li>`;
        });
        emailContent += "</ul>";
      }
    }

    // Add Footwear
    if (packingList.footwear && packingList.footwear.length > 0) {
      const filteredFootwear = packingList.footwear.filter(
        (item) => !item.isEmpty && item.quantity > 0
      );
      if (filteredFootwear.length > 0) {
        emailContent += "<h2>Footwear</h2><ul>";
        filteredFootwear.forEach((item) => {
          emailContent += `<li>${item.name} (Quantity: ${item.quantity}) ${
            item.isChecked ? "(Packed)" : "(Not Packed)"
          }</li>`;
        });
        emailContent += "</ul>";
      }
    }

    // Add Accessories
    if (packingList.accessories && packingList.accessories.length > 0) {
      const filteredAccessories = packingList.accessories.filter(
        (item) => !item.isEmpty && item.quantity > 0
      );
      if (filteredAccessories.length > 0) {
        emailContent += "<h2>Accessories</h2><ul>";
        filteredAccessories.forEach((item) => {
          emailContent += `<li>${item.name} (Quantity: ${item.quantity}) ${
            item.isChecked ? "(Packed)" : "(Not Packed)"
          }</li>`;
        });
        emailContent += "</ul>";
      }
    }

    // Add Personal Items
    if (packingList.personal_items && packingList.personal_items.length > 0) {
      const filteredPersonal = packingList.personal_items.filter(
        (item) => !item.isEmpty && item.quantity > 0
      );
      if (filteredPersonal.length > 0) {
        emailContent += "<h2>Personal Items</h2><ul>";
        filteredPersonal.forEach((item) => {
          emailContent += `<li>${item.name} (Quantity: ${item.quantity}) ${
            item.isChecked ? "(Packed)" : "(Not Packed)"
          }</li>`;
        });
        emailContent += "</ul>";
      }
    }

    if (
      packingList.clothes &&
      packingList.clothes.filter((item) => !item.isEmpty && item.quantity > 0)
        .length === 0 &&
      packingList.footwear &&
      packingList.footwear.filter((item) => !item.isEmpty && item.quantity > 0)
        .length === 0 &&
      packingList.accessories &&
      packingList.accessories.filter(
        (item) => !item.isEmpty && item.quantity > 0
      ).length === 0 &&
      packingList.personal_items &&
      packingList.personal_items.filter(
        (item) => !item.isEmpty && item.quantity > 0
      ).length === 0
    ) {
      emailContent +=
        "<p>Your packing list is currently empty. Start adding items to prepare for your trip!</p>";
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: `Your Packly Packing List for ${tripName || "Your Trip"}`,
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(
      `Packing list email sent to ${recipientEmail} for trip: ${tripName}`
    );
    res.status(200).send({ message: "Packing list sent to your email!" });
  } catch (error) {
    console.error("Error sending packing list email:", error);
    res.status(500).send({
      message: "Failed to send packing list email.",
      error: error.message,
    });
  }
};

module.exports = {
  getPackingLists,
  getPackingListById,
  getItemsForPackingList,
  createPackingList,
  updatePackingList,
  deletePackingList,
  addItemToPackingList,
  removeItemFromPackingList,
  sendPackingListEmail,
};
