const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/auth");

router.post("/login", adminController.login);
router.post("/logout", authMiddleware, adminController.logout);

router.post("/create", adminController.create);

module.exports = router;
