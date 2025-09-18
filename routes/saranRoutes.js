const express = require("express");
const router = express.Router();
const saranController = require("../controllers/saranController");

router.post("/", saranController.createSaran);
router.get("/", saranController.getAllSaran);
router.get("/:id", saranController.getSaranById);
router.put("/:id/status", saranController.updateSaranStatus);
router.delete("/:id", saranController.deleteSaran);

module.exports = router;
