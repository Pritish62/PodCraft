const Project = require("../models/Project");

async function getUserHistory(req, res) {
	try {
		const requestedLimit = Number(req.query.limit) || 50;
		const safeLimit = Math.min(200, Math.max(1, requestedLimit));

		const historyItems = await Project.find({ userId: req.userId })
			.sort({ updatedAt: -1 })
			.limit(safeLimit)
			.select("_id projectName topic updatedAt")
			.lean();

		return res.json({
			history: historyItems.map((item) => ({
				id: String(item._id),
				title: item.projectName || item.topic || "Untitled Chat",
				topic: item.topic,
				createdAt: item.updatedAt,
			})),
		});
	} catch (error) {
		return res.status(500).json({ error: error.message || "Failed to fetch history" });
	}
}

module.exports = {
	getUserHistory,
};
