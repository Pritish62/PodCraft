const mongoose = require("mongoose");

const projectVersionSchema = new mongoose.Schema(
	{
		versionNumber: {
			type: Number,
			required: true,
			min: 1,
		},
		prompt: {
			type: String,
			default: "",
			trim: true,
		},
		outputScript: {
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

const projectSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		projectName: {
			type: String,
			required: true,
			trim: true,
			maxlength: 120,
		},
		topic: {
			type: String,
			default: "",
			trim: true,
			maxlength: 120,
		},
		details: {
			type: String,
			default: "",
			trim: true,
			maxlength: 1200,
		},
		language: {
			type: String,
			default: "",
			trim: true,
			maxlength: 40,
		},
		tone: {
			type: String,
			default: "",
			trim: true,
			maxlength: 40,
		},
		hosts: {
			type: Number,
			default: 2,
			min: 1,
			max: 4,
		},
		prompt: {
			type: String,
			default: "",
			trim: true,
		},
		outputScript: {
			type: String,
			default: "",
			trim: true,
		},
		versions: {
			type: [projectVersionSchema],
			default: [],
		},
	},
	{
		timestamps: true,
	}
);

projectSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model("Project", projectSchema);
