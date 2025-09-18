const express = require("express");
const router = express.Router();
const galeriController = require("../controllers/galeriController");
const strukturController = require("../controllers/strukturController");
const infoUmumController = require("../controllers/infoUmumController");
const merchandiseController = require("../controllers/merchandiseController");

router.get("/galeri", galeriController.getAllGaleri);
router.get("/struktur", strukturController.getAllStruktur);
router.get("/info-umum", infoUmumController.getInfoUmum);
router.get("/merchandise", merchandiseController.getAllMerchandise);

module.exports = router;
