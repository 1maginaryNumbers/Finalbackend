const express = require("express");
const router = express.Router();
const umatController = require("../controllers/umatController");
const broadcastController = require("../controllers/broadcastController");
const authMiddleware = require("../middlewares/auth");

router.post("/", umatController.createUmat);
router.get("/", umatController.getAllUmat);
router.post("/broadcast", authMiddleware, broadcastController.sendBroadcast);
router.get("/broadcast/recipients", authMiddleware, broadcastController.getUmatForBroadcast);
router.get("/check/:nama", umatController.checkUmatByName);
router.get("/:id", umatController.getUmatById);
router.put("/:id", umatController.updateUmat);
router.delete("/:id", umatController.deleteUmat);

module.exports = router;
