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
const upload = require("../middlewares/upload");

const {
  validatePackingListId,
  validatePackingListItemId,
} = require("../middlewares/validation");

router.get("/", auth, getPackingLists);
router.get("/:packingListId", auth, validatePackingListId, getPackingListById);

router.post("/", auth, upload.single('image'), createPackingList);

router.post(
  "/:packingListId/items",
  auth,
  validatePackingListId,
  addItemToPackingList
);

router.put("/:packingListId", auth, validatePackingListId, updatePackingList);

router.delete(
  "/:packingListId",
  auth,
  validatePackingListId,
  deletePackingList
);
router.delete(
  "/:packingListId/items/:itemId",
  auth,
  validatePackingListId,
  validatePackingListItemId,
  removeItemFromPackingList
);

module.exports = router;
