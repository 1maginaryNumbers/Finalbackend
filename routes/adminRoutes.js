const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

router.post("/login", adminController.login);

// Add new admin
router.post("/create", adminController.create);

module.exports = router;
