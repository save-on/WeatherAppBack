const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const {
  createTripWithPackingList,
  getTrips,
  getTripById,
} = require("../controllers/trips");

router.post("/", auth, createTripWithPackingList);

//router.get("/", auth, getTrips);
router.get("/:tripId", auth, getTripById);

module.exports = router;
