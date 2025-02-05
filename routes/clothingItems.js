const router = require("express").Router();
const {
  getClothingItems,
  createClothingItem,
  deleteClothingItem,
} = require("../controllers/clothingItems");
const auth = require("../middlewares/auth");
const {
  validateCardBody,
  validateItemId,
} = require("../middlewares/validation");

router.get("/", getClothingItems);
router.post("/", auth, validateCardBody, createClothingItem);
router.delete("/:itemId", auth, validateItemId, deleteClothingItem);

module.exports = router;
