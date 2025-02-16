const router = require("express").Router();
const { searchWeather } = require("../controllers/weatherapi");

router.get("/", searchWeather);

module.exports = router;
