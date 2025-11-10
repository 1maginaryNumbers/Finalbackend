const express = require("express");
const router = express.Router();
const jadwalController = require("../controllers/jadwalController");
const authMiddleware = require("../middlewares/auth");

router.post("/", authMiddleware, jadwalController.createJadwal);
router.get("/", jadwalController.getAllJadwal);
router.post("/bulk-delete", authMiddleware, jadwalController.bulkDeleteJadwal);
router.get("/:id", jadwalController.getJadwalById);
router.put("/:id", authMiddleware, jadwalController.updateJadwal);
router.delete("/:id", authMiddleware, jadwalController.deleteJadwal);

module.exports = router;

