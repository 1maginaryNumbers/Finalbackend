const express = require("express");
const router = express.Router();
const merchandiseController = require("../controllers/merchandiseController");
const uploadMerchandise = require("../middlewares/uploadMerchandise");

router.post("/", uploadMerchandise.single('gambar'), merchandiseController.createMerchandise);
router.get("/", merchandiseController.getAllMerchandise);
router.get("/:id", merchandiseController.getMerchandiseById);
router.put("/:id", uploadMerchandise.single('gambar'), merchandiseController.updateMerchandise);
router.delete("/:id", merchandiseController.deleteMerchandise);

module.exports = router;
