const router = require("express").Router();
const { likeItem, dislikeItem } = require("../controllers/likes");
const auth = require("../middlewares/auth");

router.put("/:itemId/likes", auth, likeItem);
router.delete("/:itemId/likes", auth, dislikeItem);

module.exports = router;
