const router = require("express").Router();
const {
  getClothingItems,
  createClothingItem,
  deleteClothingItem,
} = require("../controllers/clothingItems");
const auth = require("../middlewares/auth");
const upload = require("../middlewares/upload");

const {
  validateCardBody,
  validateItemId,
} = require("../middlewares/validation");

router.get("/", getClothingItems);
router.post("/", auth, upload.single("clothing_image"), validateCardBody, createClothingItem);
router.delete("/:itemId", auth, validateItemId, deleteClothingItem);

module.exports = router;
