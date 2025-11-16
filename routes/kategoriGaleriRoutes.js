const express = require("express");
const router = express.Router();
const kategoriGaleriController = require("../controllers/kategoriGaleriController");
const authMiddleware = require("../middlewares/auth");

router.post("/", authMiddleware, kategoriGaleriController.createKategori);
router.get("/", kategoriGaleriController.getAllKategori);
router.put("/:id", authMiddleware, kategoriGaleriController.updateKategori);
router.delete("/:id", authMiddleware, kategoriGaleriController.deleteKategori);

module.exports = router;

