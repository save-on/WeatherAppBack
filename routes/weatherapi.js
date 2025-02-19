const router = require("express").Router();
const { searchWeather } = require("../controllers/weatherapi");

router.post("/", searchWeather);

module.exports = router;
