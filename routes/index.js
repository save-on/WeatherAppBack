const router = require("express").Router();
const clothingItemRouter = require("./clothingItems");
const userRouter = require("./users");
const weatherApiRouter = require("./weatherapi");
const packingListsRouter = require("./packingLists.js");
const auth = require("../middlewares/auth.js");


router.use("/clothing-items", clothingItemRouter);
router.use("/weather", weatherApiRouter);
router.use("/users", userRouter);
router.use("/packing-lists", packingListsRouter);
router.use("/", userRouter);


module.exports = router;
