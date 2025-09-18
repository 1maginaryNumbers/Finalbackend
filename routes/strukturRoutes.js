const express = require("express");
const router = express.Router();
const strukturController = require("../controllers/strukturController");

router.post("/", strukturController.createStruktur);
router.get("/", strukturController.getAllStruktur);
router.get("/:id", strukturController.getStrukturById);
router.put("/:id", strukturController.updateStruktur);
router.delete("/:id", strukturController.deleteStruktur);

module.exports = router;
