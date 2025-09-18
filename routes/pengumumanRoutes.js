const express = require("express");
const router = express.Router();
const pengumumanController = require("../controllers/pengumumanController");
const authMiddleware = require("../middlewares/auth");

router.post("/", authMiddleware, pengumumanController.createPengumuman);
router.get("/", pengumumanController.getAllPengumuman);
router.get("/:id", pengumumanController.getPengumumanById);
router.put("/:id", authMiddleware, pengumumanController.updatePengumuman);
router.delete("/:id", authMiddleware, pengumumanController.deletePengumuman);

module.exports = router;
