const router = require("express").Router();
const {
  getPackingLists,
  createPackingList,
  deletePackingList,
} = require("../controllers/packingLists");

const auth = require("../middlewares/auth");

const validatePackingListId = require("../middlewares/validation")

router.get("/", getPackingLists);
router.post("/", createPackingList);


module.exports = router;