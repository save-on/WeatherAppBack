const router = require("express").Router();
const { likeItem, dislikeItem } = require("../controllers/likes");
const auth = require("../middlewares/auth");
const { validateItemId } = require("../middlewares/validation");

router.put("/:itemId/likes", auth, validateItemId, likeItem);
router.delete("/:itemId/likes", auth, validateItemId, dislikeItem);

module.exports = router;
