const express = require("express");
const router = express.Router();
const kegiatanController = require("../controllers/kegiatanController");
const pendaftaranController = require("../controllers/pendaftaranController");
const authMiddleware = require("../middlewares/auth");

router.post("/", authMiddleware, kegiatanController.createKegiatan);
router.get("/", kegiatanController.getAllKegiatan);
router.post("/:kegiatanId/daftar", pendaftaranController.createPendaftaran);
router.post("/:kegiatanId/daftar-kegiatan", authMiddleware, pendaftaranController.daftarKegiatan);
router.get("/:kegiatanId/pendaftaran", pendaftaranController.getPendaftaranByKegiatan);
router.get("/:id", kegiatanController.getKegiatanById);
router.put("/:id", authMiddleware, kegiatanController.updateKegiatan);
router.put("/:id/activate", authMiddleware, kegiatanController.activateKegiatan);
router.delete("/:id", authMiddleware, kegiatanController.deleteKegiatan);

module.exports = router;
