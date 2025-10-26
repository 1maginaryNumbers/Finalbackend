const express = require("express");
const router = express.Router();
const galeriController = require("../controllers/galeriController");
const { upload, handleMulterError } = require("../middlewares/upload");

router.post("/", upload.single('images'), handleMulterError, galeriController.createGaleri);
router.get("/", galeriController.getAllGaleri);
router.get("/kategoris", galeriController.getGaleriKategoris);
router.get("/kategori/:kategori", galeriController.getGaleriByKategori);
router.get("/:id", galeriController.getGaleriById);
router.put("/:id", upload.single('images'), handleMulterError, galeriController.updateGaleri);
router.delete("/:id", galeriController.deleteGaleri);

module.exports = router;