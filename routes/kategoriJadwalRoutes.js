const express = require("express");
const router = express.Router();
const kategoriJadwalController = require("../controllers/kategoriJadwalController");
const authMiddleware = require("../middlewares/auth");

router.post("/", authMiddleware, kategoriJadwalController.createKategori);
router.get("/", kategoriJadwalController.getAllKategori);
router.put("/:id", authMiddleware, kategoriJadwalController.updateKategori);
router.delete("/:id", authMiddleware, kategoriJadwalController.deleteKategori);

module.exports = router;

