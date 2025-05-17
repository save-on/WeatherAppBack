const router = require("express").Router();
const {
createPackingList,
deletePackingList,
updatePackingList,
createPackingListItem
} = require("../controllers/packingLists");

router.post("/", createPackingList);
router.delete("/:packing_id", deletePackingList);
router.patch("/:packing_id", updatePackingList);
router.post("/:packing_id/item", createPackingListItem)

module.exports = router;

