const router = require("express").Router();
const {
  createClothingItem,
  deleteClothingItem,
} = require("../controllers/clothingItems");
const auth = require("../middlewares/auth");

const {
  validateCardBody,
  validateItemId,
} = require("../middlewares/validation");

router.delete("/:itemId", auth, validateItemId, deleteClothingItem);
router.post("/", auth, validateCardBody, createClothingItem);

module.exports = router;
