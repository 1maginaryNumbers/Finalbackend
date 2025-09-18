const express = require("express");
const router = express.Router();
const absensiController = require("../controllers/absensiController");

router.post("/scan", absensiController.scanQRCode);
router.post("/", absensiController.createAbsensi);
router.get("/", absensiController.getAllAbsensi);
router.get("/kegiatan/:kegiatanId", absensiController.getAbsensiByKegiatan);
router.put("/:id", absensiController.updateAbsensi);
router.delete("/:id", absensiController.deleteAbsensi);

module.exports = router;
