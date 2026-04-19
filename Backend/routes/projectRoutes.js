const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
	listUserProjects,
	getProjectById,
	createProject,
	updateProjectById,
	generateProjectScript,
} = require("../controllers/projectController");

const router = express.Router();

router.use(requireAuth);

router.get("/", listUserProjects);
router.post("/", createProject);
router.post("/generate", generateProjectScript);
router.get("/:projectId", getProjectById);
router.put("/:projectId", updateProjectById);

module.exports = router;
