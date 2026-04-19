const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { getUserHistory } = require("../controllers/historyController");

const router = express.Router();

router.get("/", requireAuth, getUserHistory);

module.exports = router;
