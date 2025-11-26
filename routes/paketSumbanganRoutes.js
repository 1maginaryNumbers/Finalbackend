const express = require("express");
const router = express.Router();
const paketSumbanganController = require("../controllers/paketSumbanganController");
const { upload, handleMulterError } = require("../middlewares/upload");

router.post("/", upload.single('gambar'), handleMulterError, paketSumbanganController.createPaketSumbangan);
router.get("/", paketSumbanganController.getAllPaketSumbangan);
router.get("/:id", paketSumbanganController.getPaketSumbanganById);
router.put("/:id", upload.single('gambar'), handleMulterError, paketSumbanganController.updatePaketSumbangan);
router.delete("/:id", paketSumbanganController.deletePaketSumbangan);

router.post("/payment", paketSumbanganController.createPayment);
router.get("/transaksi/all", paketSumbanganController.getAllTransaksi);
router.put("/transaksi/:id/status", paketSumbanganController.updateTransaksiStatus);
router.post("/webhook", paketSumbanganController.handleWebhook);

module.exports = router;

