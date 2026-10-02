const express = require("express");

const {
  registerUser,
  loginUser,
  registerTherapist,
  loginTherapist,
} = require("../controllers/authController");

const router = express.Router();

router.post("/user/register", registerUser);
router.post("/user/login", loginUser);

router.post("/therapist/register", registerTherapist);
router.post("/therapist/login", loginTherapist);

module.exports = router;