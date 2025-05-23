const router = require("express").Router();
const {
  getPackingLists,
  getPackingListById,
  getItemsForPackingList,
  createPackingList,
  updatePackingList,
  deletePackingList,
  addItemToPackingList,
  removeItemFromPackingList,
  sendPackingListEmail,
} = require("../controllers/packingLists");

const auth = require("../middlewares/auth");
const upload = require("../middlewares/upload");

const {
  validatePackingListId,
  validatePackingListItemId,
} = require("../middlewares/validation");



router.get("/:packingListId/items", auth, getItemsForPackingList)
router.get("/", auth, getPackingLists);
router.get("/:packingListId", auth, validatePackingListId, getPackingListById);

router.post("/", auth, upload.single('image'), createPackingList);

router.post(
  "/:packingListId/items",
  auth,
  validatePackingListId,
  addItemToPackingList
);

router.post("/send-packing-list", auth, sendPackingListEmail);

router.put("/:packingListId", auth, validatePackingListId, updatePackingList);
router.delete('/:packingListId', auth, deletePackingList);


router.delete(
  "/packing-lists/:packingListId/items/:itemId",
  auth,
  validatePackingListId,
  validatePackingListItemId,
  removeItemFromPackingList
);

router.delete("/:packingListId/items/:itemId", auth, async (req, res, next) => {
  try {
    await removeItemFromPackingList(req, res, next); 
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
  }
});

module.exports = router;

