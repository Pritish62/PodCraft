const ChatHistory = require("../models/ChatHistory");

async function getUserHistory(req, res) {
	try {
		const requestedLimit = Number(req.query.limit) || 50;
		const safeLimit = Math.min(200, Math.max(1, requestedLimit));

		const historyItems = await ChatHistory.find({ userId: req.userId })
			.sort({ createdAt: -1 })
			.limit(safeLimit)
			.select("_id title topic createdAt")
			.lean();

		return res.json({
			history: historyItems.map((item) => ({
				id: String(item._id),
				title: item.title,
				topic: item.topic,
				createdAt: item.createdAt,
			})),
		});
	} catch (error) {
		return res.status(500).json({ error: error.message || "Failed to fetch history" });
	}
}

module.exports = {
	getUserHistory,
};
