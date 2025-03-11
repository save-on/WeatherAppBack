const router = require("express").Router();
const clothingItemRouter = require("./clothingItems");
const packingListRouter = require("./packingLists");
const userRouter = require("./users");
const likeRouter = require("./likes");
const weatherApi = require("./weatherapi");
const upload = require("../middlewares/upload");
const NotFoundError = require("../utils/errorclasses/NotFoundError");
const auth = require("../middlewares/auth.js");


router.use("/clothing-items", clothingItemRouter);
router.use("/clothing-items", likeRouter);
router.use("/weather", weatherApi);
router.use("/users", userRouter);
router.use("/profile/packing-lists", packingListRouter);
router.use("/items", clothingItemRouter);
router.use("/", userRouter);
router.use("/profile/packing-lists", packingListRouter);


module.exports = router;
