const express = require("express");
const router = express.Router();
const umatController = require("../controllers/umatController");
const broadcastController = require("../controllers/broadcastController");

router.post("/", umatController.createUmat);
router.get("/", umatController.getAllUmat);
router.post("/broadcast", broadcastController.sendBroadcast);
router.get("/broadcast/recipients", broadcastController.getUmatForBroadcast);
router.get("/:id", umatController.getUmatById);
router.put("/:id", umatController.updateUmat);
router.delete("/:id", umatController.deleteUmat);

module.exports = router;
