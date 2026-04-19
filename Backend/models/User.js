const mongoose = require("mongoose");

const historyItemSchema = new mongoose.Schema(
	{
		topic: {
			type: String,
			default: "",
			trim: true,
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
		createdAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ _id: false }
);

const userSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			index: true,
			trim: true,
			lowercase: true,
		},
		mobile: {
			type: String,
			required: true,
			trim: true,
		},
		passwordHash: {
			type: String,
			required: true,
		},
		history: {
			type: [historyItemSchema],
			default: [],
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("User", userSchema);
