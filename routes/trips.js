const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const {
  createTripWithPackingList,
  getTrips,
  getTripById,
  deleteTripById,
} = require("../controllers/trips");

router.post("/", auth, createTripWithPackingList);

//router.get("/", auth, getTrips);
router.get("/:tripId", auth, getTripById);
router.get("/", auth, getTrips);

router.delete("/:tripId", auth, deleteTripById);

module.exports = router;
