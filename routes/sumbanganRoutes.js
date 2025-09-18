const express = require("express");
const router = express.Router();
const sumbanganController = require("../controllers/sumbanganController");

router.post("/", sumbanganController.createSumbangan);
router.get("/", sumbanganController.getAllSumbangan);
router.post("/transaksi", sumbanganController.createTransaksi);
router.get("/transaksi", sumbanganController.getAllTransaksi);
router.put("/transaksi/:id/status", sumbanganController.updateTransaksiStatus);
router.get("/:id", sumbanganController.getSumbanganById);
router.put("/:id", sumbanganController.updateSumbangan);
router.delete("/:id", sumbanganController.deleteSumbangan);

module.exports = router;
