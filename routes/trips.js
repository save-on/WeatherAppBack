const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const tripsController = require("../controllers/trips");

router.post("/", auth, tripsController.createTripWithPackingList);

module.exports = router;
