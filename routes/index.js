const router = require("express").Router();
const clothingItemRouter = require("./clothingItems");
const packingListRouter = require("./packingLists");
const userRouter = require("./users");
const likeRouter = require("./likes");
const weatherApi = require("./weatherapi");
const upload = require("../middlewares/upload");
const NotFoundError = require("../utils/errorclasses/NotFoundError");

router.use("/clothing-items", clothingItemRouter);
router.use("/clothing-items", likeRouter);
router.use("/weather", weatherApi);
router.use("/users", userRouter);
router.use("/profile/packing-lists", packingListRouter);



// Defensive code
// router.use(() => {
//   throw new NotFoundError("The Requested resource was not found.");
// });

module.exports = router;
