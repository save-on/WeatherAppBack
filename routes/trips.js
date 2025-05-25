const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const { createTripWithPackingList, getTrips } = require("../controllers/trips");

router.post("/", auth, createTripWithPackingList);

router.get("/", auth, getTrips);

module.exports = router;
