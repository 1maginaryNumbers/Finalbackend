const express = require("express");
const router = express.Router();
const merchandiseTransaksiController = require("../controllers/merchandiseTransaksiController");
const authMiddleware = require("../middlewares/auth");

router.post("/", merchandiseTransaksiController.createMerchandiseTransaksi);
router.get("/", authMiddleware, merchandiseTransaksiController.getAllMerchandiseTransaksi);
router.get("/:id", authMiddleware, merchandiseTransaksiController.getMerchandiseTransaksiById);
router.put("/:id/status", authMiddleware, merchandiseTransaksiController.updateMerchandiseTransaksiStatus);
router.post("/webhook", merchandiseTransaksiController.handleWebhook);

module.exports = router;

