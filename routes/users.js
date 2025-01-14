const router = require("express").Router();
const {
  getCurrentUser,
  createUser,
  signin,
  updateCurrentUser,
} = require("../controllers/users");
const auth = require("../middlewares/auth");
// const { validateUserUpdate } = require("../middlewares/validation");

router.get("/me", auth, getCurrentUser);
router.patch("/me", auth, updateCurrentUser);
router.post("/signup", createUser);
router.post("/signin", signin);

module.exports = router;
