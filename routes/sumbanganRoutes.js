const express = require("express");
const router = express.Router();
const sumbanganController = require("../controllers/sumbanganController");
const { upload, handleMulterError } = require("../middlewares/upload");

router.post("/", upload.single('qrisImage'), handleMulterError, sumbanganController.createSumbangan);
router.get("/", sumbanganController.getAllSumbangan);
router.post("/transaksi", sumbanganController.createTransaksi);
router.post("/payment", sumbanganController.createPayment);
router.post("/webhook", sumbanganController.handleWebhook);
router.get("/transaksi", sumbanganController.getAllTransaksi);
router.put("/transaksi/:id/status", sumbanganController.updateTransaksiStatus);
router.get("/:id", sumbanganController.getSumbanganById);
router.get("/:id/qris-image", sumbanganController.getQRISImage);
router.get("/:id/qris-string", sumbanganController.getQRISString);
router.put("/:id", upload.single('qrisImage'), handleMulterError, sumbanganController.updateSumbangan);
router.delete("/:id", sumbanganController.deleteSumbangan);

module.exports = router;
