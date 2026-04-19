const mongoose = require("mongoose");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Project = require("../models/Project");

const GEMINI_API_KEY = (process.env.KEY || "").trim();
const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim() || "gemini-2.5-flash";
const MAX_PROMPT_LENGTH = Number(process.env.MAX_PROMPT_LENGTH) || 8000;

const TOPIC_MAX_LENGTH = 120;
const DETAILS_MAX_LENGTH = 1200;
const LANGUAGE_OPTIONS = ["English", "Hindi", "Hinglish"];
const TONE_OPTIONS = ["Educational", "Casual", "Humorous"];
const DEFAULT_LANGUAGE = "Hinglish";
const DEFAULT_TONE = "Casual";
const DEFAULT_HOSTS = 2;

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

function normalizeText(value) {
	if (typeof value !== "string") {
		return "";
	}

	return value.replace(/\s+/g, " ").trim();
}

function clampText(value, maxLength) {
	if (value.length <= maxLength) {
		return value;
	}

	return value.slice(0, maxLength).trim();
}

function normalizeChoice(value, allowedOptions, fallback) {
	if (typeof value !== "string") {
		return fallback;
	}

	const trimmedValue = value.trim();
	return allowedOptions.includes(trimmedValue) ? trimmedValue : fallback;
}

function normalizeHosts(hosts) {
	const parsedHosts = Number(hosts);

	if (!Number.isFinite(parsedHosts)) {
		return DEFAULT_HOSTS;
	}

	return Math.min(4, Math.max(1, Math.floor(parsedHosts)));
}

function sanitizeProjectPayload(body = {}, { withDefaults = false } = {}) {
	const safeTopic = clampText(normalizeText(body.topic), TOPIC_MAX_LENGTH);
	const safeDetails = clampText(normalizeText(body.details), DETAILS_MAX_LENGTH);
	const fallbackLanguage = withDefaults ? DEFAULT_LANGUAGE : "";
	const fallbackTone = withDefaults ? DEFAULT_TONE : "";

	const safeLanguage = normalizeChoice(body.language, LANGUAGE_OPTIONS, fallbackLanguage);
	const safeTone = normalizeChoice(body.tone, TONE_OPTIONS, fallbackTone);
	const safeHosts = normalizeHosts(body.hosts);
	const safeOutputScript = typeof body.outputScript === "string" ? body.outputScript : "";
	const safeProjectName = clampText(normalizeText(body.projectName), TOPIC_MAX_LENGTH);

	return {
		projectName: safeProjectName,
		topic: safeTopic,
		details: safeDetails,
		language: safeLanguage,
		tone: safeTone,
		hosts: safeHosts,
		outputScript: safeOutputScript,
	};
}

function buildPodcastPromptTemplate({ topic, details, language, tone, hosts }) {
	const formatLines = Array.from({ length: hosts }, (_, index) => `Host ${index + 1}: ...`).join("\n");

	return [
		"Generate a podcast script.",
		"",
		`Topic: ${topic || "N/A"}`,
		`Topic Details: ${details || "Not provided"}`,
		`Tone: ${tone}`,
		`Language: ${language}`,
		`Hosts: ${hosts}`,
		"",
		"Format:",
		formatLines,
		"",
		"Make it engaging and natural.",
	].join("\n");
}

function toProjectResponse(projectDoc) {
	return {
		id: String(projectDoc._id),
		projectName: projectDoc.projectName,
		topic: projectDoc.topic,
		details: projectDoc.details,
		language: projectDoc.language,
		tone: projectDoc.tone,
		hosts: projectDoc.hosts,
		prompt: projectDoc.prompt || "",
		outputScript: projectDoc.outputScript || "",
		createdAt: projectDoc.createdAt,
		updatedAt: projectDoc.updatedAt,
	};
}

function isValidObjectId(value) {
	return mongoose.Types.ObjectId.isValid(value);
}

async function listUserProjects(req, res) {
	try {
		const requestedLimit = Number(req.query.limit) || 100;
		const safeLimit = Math.min(200, Math.max(1, requestedLimit));

		const projects = await Project.find({ userId: req.userId })
			.sort({ updatedAt: -1 })
			.limit(safeLimit)
			.lean();

		return res.json({
			projects: projects.map((project) =>
				toProjectResponse({
					...project,
					_id: project._id,
				})
			),
		});
	} catch (error) {
		return res.status(500).json({ error: error.message || "Failed to fetch projects" });
	}
}

async function getProjectById(req, res) {
	try {
		const { projectId } = req.params;

		if (!isValidObjectId(projectId)) {
			return res.status(400).json({ error: "Invalid project id" });
		}

		const project = await Project.findOne({ _id: projectId, userId: req.userId });
		if (!project) {
			return res.status(404).json({ error: "Project not found" });
		}

		return res.json({ project: toProjectResponse(project) });
	} catch (error) {
		return res.status(500).json({ error: error.message || "Failed to fetch project" });
	}
}

async function createProject(req, res) {
	try {
		const payload = sanitizeProjectPayload(req.body, { withDefaults: false });
		const projectName = payload.projectName || payload.topic || "Untitled Project";

		const project = await Project.create({
			userId: req.userId,
			projectName,
			topic: payload.topic,
			details: payload.details,
			language: payload.language,
			tone: payload.tone,
			hosts: payload.hosts,
			outputScript: payload.outputScript,
			prompt: typeof req.body?.prompt === "string" ? req.body.prompt : "",
		});

		return res.status(201).json({ project: toProjectResponse(project) });
	} catch (error) {
		return res.status(500).json({ error: error.message || "Failed to create project" });
	}
}

async function updateProjectById(req, res) {
	try {
		const { projectId } = req.params;

		if (!isValidObjectId(projectId)) {
			return res.status(400).json({ error: "Invalid project id" });
		}

		const project = await Project.findOne({ _id: projectId, userId: req.userId });
		if (!project) {
			return res.status(404).json({ error: "Project not found" });
		}

		const payload = sanitizeProjectPayload(req.body, { withDefaults: false });
		project.projectName = payload.projectName || payload.topic || project.projectName || "Untitled Project";
		project.topic = payload.topic;
		project.details = payload.details;
		project.language = payload.language;
		project.tone = payload.tone;
		project.hosts = payload.hosts;
		project.outputScript = payload.outputScript;

		if (typeof req.body?.prompt === "string") {
			project.prompt = req.body.prompt;
		}

		await project.save();
		return res.json({ project: toProjectResponse(project) });
	} catch (error) {
		return res.status(500).json({ error: error.message || "Failed to update project" });
	}
}

async function generateProjectScript(req, res) {
	try {
		if (!genAI) {
			return res.status(500).json({ error: "Gemini API key is not configured" });
		}

		const payload = sanitizeProjectPayload(req.body, { withDefaults: true });
		if (!payload.topic) {
			return res.status(400).json({ error: "Topic is required" });
		}

		const prompt = buildPodcastPromptTemplate({
			topic: payload.topic,
			details: payload.details,
			language: payload.language,
			tone: payload.tone,
			hosts: payload.hosts,
		});

		if (prompt.length > MAX_PROMPT_LENGTH) {
			return res.status(400).json({
				error: `prompt is too long (max ${MAX_PROMPT_LENGTH} characters)`,
			});
		}

		const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
		const result = await model.generateContent(prompt);
		const outputScript = result?.response?.text?.().trim() || "No response returned from backend.";

		const rawProjectId = typeof req.body?.projectId === "string" ? req.body.projectId.trim() : "";
		const projectName = payload.projectName || payload.topic || "Untitled Project";
		let project;

		if (rawProjectId) {
			if (!isValidObjectId(rawProjectId)) {
				return res.status(400).json({ error: "Invalid project id" });
			}

			project = await Project.findOne({ _id: rawProjectId, userId: req.userId });
		}

		if (!project) {
			project = new Project({
				userId: req.userId,
				projectName,
				topic: payload.topic,
				details: payload.details,
				language: payload.language,
				tone: payload.tone,
				hosts: payload.hosts,
				prompt,
				outputScript,
			});
		} else {
			project.projectName = projectName;
			project.topic = payload.topic;
			project.details = payload.details;
			project.language = payload.language;
			project.tone = payload.tone;
			project.hosts = payload.hosts;
			project.prompt = prompt;
			project.outputScript = outputScript;
		}

		await project.save();
		return res.json({ project: toProjectResponse(project) });
	} catch (error) {
		const message = error?.message || "Gemini request failed";
		const causeMessage = error?.cause?.message;
		return res.status(500).json({ error: causeMessage ? `${message}: ${causeMessage}` : message });
	}
}

module.exports = {
	listUserProjects,
	getProjectById,
	createProject,
	updateProjectById,
	generateProjectScript,
};
