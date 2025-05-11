const router = require("express").Router();
const clothingItemRouter = require("./clothingItems");
const userRouter = require("./users");
const weatherApi = require("./weatherapi");
const auth = require("../middlewares/auth.js");


router.use("/clothing-items", clothingItemRouter);
router.use("/weather", weatherApi);
router.use("/users", userRouter);
router.use("/items", clothingItemRouter);
router.use("/", userRouter);


module.exports = router;
