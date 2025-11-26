const express = require("express");
const router = express.Router();
const faqController = require("../controllers/faqController");
const authMiddleware = require("../middlewares/auth");

router.post("/", authMiddleware, faqController.createFAQ);
router.get("/public", faqController.getPublicFAQ);
router.get("/", authMiddleware, faqController.getAllFAQ);
router.get("/:id", authMiddleware, faqController.getFAQById);
router.put("/:id", authMiddleware, faqController.updateFAQ);
router.delete("/:id", authMiddleware, faqController.deleteFAQ);

module.exports = router;

