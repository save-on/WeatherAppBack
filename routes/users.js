const router = require("express").Router();
const {
  getCurrentUser,
  createUser,
  signInUser,
  updateCurrentUser,
} = require("../controllers/users");
const auth = require("../middlewares/auth");
const {
  validateUserUpdate,
  validateUserBody,
  validateUserCredentials,
} = require("../middlewares/validation");

router.get("/me", auth, getCurrentUser);
router.patch("/me", auth, validateUserUpdate, updateCurrentUser);
router.post("/signup", validateUserBody, createUser);
router.post("/signin", validateUserCredentials, signInUser);

module.exports = router;
