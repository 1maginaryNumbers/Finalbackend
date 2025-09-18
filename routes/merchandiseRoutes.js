const express = require("express");
const router = express.Router();
const merchandiseController = require("../controllers/merchandiseController");

router.post("/", merchandiseController.createMerchandise);
router.get("/", merchandiseController.getAllMerchandise);
router.get("/kategori/:kategori", merchandiseController.getMerchandiseByKategori);
router.get("/:id", merchandiseController.getMerchandiseById);
router.put("/:id", merchandiseController.updateMerchandise);
router.delete("/:id", merchandiseController.deleteMerchandise);

module.exports = router;
