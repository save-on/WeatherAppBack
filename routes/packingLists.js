const router = require("express").Router();
const {
  getPackingLists,
  getPackingListById,
  createPackingList,
  updatePackingList,
  deletePackingList,
  addItemToPackingList,
  removeItemFromPackingList,
} = require("../controllers/packingLists");

const auth = require("../middlewares/auth");

const {
  validatePackingListId,
  validatePackingListItemId,
} = require("../middlewares/validation");

router.get("/", auth, getPackingLists);
router.get("/:packingListId", auth, validatePackingListId, getPackingListById);
router.post("/", auth, createPackingList);
router.put("/:packingListId", auth, validatePackingListId, updatePackingList);
router.delete(
  "/:packingListId",
  auth,
  validatePackingListId,
  deletePackingList
);

router.post(
  "/:packingListId/items",
  auth,
  validatePackingListId,
  addItemToPackingList
);
router.delete(
  "/:packingListId/items/:itemId",
  auth,
  validatePackingListId,
  validatePackingListItemId,
  removeItemFromPackingList
);

module.exports = router;
