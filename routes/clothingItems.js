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
router.delete("/:itemId", auth, validateItemId, deleteClothingItem);
router.post("/", auth, upload.single("clothing_image"), validateCardBody, createClothingItem);

module.exports = router;
