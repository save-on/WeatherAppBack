const router = require("express").Router();
const {
  getPackingLists,
  createPackingList,
  deletePackingList,
} = require("../controllers/packingLists");

const auth = require("../middlewares/auth");

const validatePackingListId = require("../middlewares/validation")

router.get("/profile/packing-lists", getPackingLists);
router.post("/profile/packing-lists", auth, validatePackingListId, createPackingList);


module.exports = router;