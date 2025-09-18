const express = require("express");
const router = express.Router();
const infoUmumController = require("../controllers/infoUmumController");

router.get("/", infoUmumController.getInfoUmum);
router.put("/", infoUmumController.updateInfoUmum);

module.exports = router;
