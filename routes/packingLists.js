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

router.put("/:packingListId", auth, validatePackingListId, updatePackingList);
router.delete('/:packingListId', auth, deletePackingList);

// router.delete('/packing-lists/:packingListId', auth, async (req, res, next) => {
//   try {
//     const packingListId = req.params.packingListId;
//     const userId = req.user._id;

//     const packingList = await pool.query (
//       'SELECT * FROM packing_lists WHERE id = $1 AND owner = $2',
//       [packingListId, userId]
//     );
//     if (packingList.rows.length === 0 ) {
//       return res.status(400).json({ message: "Packing list not found or unauthorized." });
//     }

//     await pool.query(
//       'DELETE FROM packing_lists WHERE id = $1', [packingListId]
//     );
//     res.status(204).send();
//   } catch (error) {
//     console.error("Error deleting packing list: ", error);
//     next(error);
//   }
// });



router.delete(
  "/packing-lists/:packingListId/items/:itemId",
  auth,
  validatePackingListId,
  validatePackingListItemId,
  removeItemFromPackingList
);

module.exports = router;
