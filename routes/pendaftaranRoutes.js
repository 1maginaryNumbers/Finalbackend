const express = require("express");
const router = express.Router();
const pendaftaranController = require("../controllers/pendaftaranController");
const authMiddleware = require("../middlewares/auth");

router.post("/", pendaftaranController.createPendaftaran);
router.get("/", pendaftaranController.getAllPendaftaran);
router.get("/check/:kegiatanId/:email", pendaftaranController.checkRegistrationStatus);
router.get("/filter/:kegiatanName", pendaftaranController.getPendaftaranByKegiatanName);
router.get("/:id", pendaftaranController.getPendaftaranById);
router.put("/:id", authMiddleware, pendaftaranController.updatePendaftaran);
router.delete("/bulk", authMiddleware, pendaftaranController.bulkDeletePendaftaran);
router.delete("/:id", authMiddleware, pendaftaranController.deletePendaftaran);

module.exports = router;
