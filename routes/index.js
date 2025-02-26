const router = require("express").Router();
const clothingItemRouter = require("./clothingItems");
const userRouter = require("./users");
const likeRouter = require("./likes");
const weatherApi = require("./weatherapi");

router.use("/clothing-items", clothingItemRouter);
router.use("/clothing-items", likeRouter);
router.use("/weather", weatherApi);
router.use("/users", userRouter);

// Defensive code
// router.use(() => {
//   throw new NotFoundError("The Requested resource was not found.");
// });

module.exports = router;
