const mongoose = require("mongoose");

const chatHistorySchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		title: {
			type: String,
			required: true,
			trim: true,
			maxlength: 120,
		},
		topic: {
			type: String,
			default: "",
			trim: true,
			maxlength: 200,
		},
		prompt: {
			type: String,
			required: true,
			trim: true,
		},
		response: {
			type: String,
			default: "",
			trim: true,
		},
	},
	{ timestamps: true }
);

chatHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("ChatHistory", chatHistorySchema);
