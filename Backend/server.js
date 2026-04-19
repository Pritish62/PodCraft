require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const User = require("./models/User");
const ChatHistory = require("./models/ChatHistory");
const { requireAuth } = require("./middleware/auth");
const historyRoutes = require("./routes/historyRoutes");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT) || 8000;
const GEMINI_API_KEY = (process.env.KEY || "").trim();
const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim() || "gemini-2.5-flash";
const MAX_PROMPT_LENGTH = Number(process.env.MAX_PROMPT_LENGTH) || 8000;
const MONGO_KEY = (process.env.MONGO_KEY || "").trim();
const JWT_SECRET = (process.env.JWT_SECRET || "dev-secret-change-me").trim();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const PASSWORD_MIN_LENGTH = 6;
const EMAIL_MAX_LENGTH = 254;
const MOBILE_REGEX = /^[0-9]{10,15}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!GEMINI_API_KEY) {
	console.warn("KEY is missing in environment variables.");
}

if (!MONGO_KEY) {
	console.warn("MONGO_KEY is missing in environment variables.");
}

if (JWT_SECRET === "dev-secret-change-me") {
	console.warn("JWT_SECRET is using default value. Set JWT_SECRET in .env for production.");
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

function normalizeEmail(email) {
	if (typeof email !== "string") {
		return "";
	}

	return email.trim().toLowerCase();
}

function normalizeMobile(mobile) {
	if (typeof mobile !== "string") {
		return "";
	}

	return mobile.trim();
}

function createAuthToken(userId) {
	return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function extractTopicFromPrompt(prompt) {
	if (typeof prompt !== "string") {
		return "";
	}

	const topicLine = prompt.split("\n").find((line) => line.startsWith("Topic:"));
	return topicLine ? topicLine.replace("Topic:", "").trim() : "";
}

async function connectDatabase() {
	if (!MONGO_KEY) {
		return;
	}

	try {
		await mongoose.connect(MONGO_KEY);
		console.log("MongoDB connected");
	} catch (error) {
		console.error("MongoDB connection failed:", error.message);
	}
}

app.get("/", (req, res) => {
	res.json({ message: "Backend server is running" });
});

app.use("/api/history", historyRoutes);

app.post("/api/auth/signup", async (req, res) => {
	try {
		if (!MONGO_KEY) {
			return res.status(500).json({ error: "MongoDB is not configured" });
		}

		const email = normalizeEmail(req.body?.email);
		const mobile = normalizeMobile(req.body?.mobile);
		const password = typeof req.body?.password === "string" ? req.body.password : "";

		if (!email || !password || !mobile) {
			return res.status(400).json({ error: "email, mobile and password are required" });
		}

		if (email.length > EMAIL_MAX_LENGTH || !EMAIL_REGEX.test(email)) {
			return res.status(400).json({ error: "Please provide a valid email" });
		}

		if (!MOBILE_REGEX.test(mobile)) {
			return res.status(400).json({ error: "Please provide a valid mobile number" });
		}

		if (password.length < PASSWORD_MIN_LENGTH) {
			return res.status(400).json({ error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` });
		}

		const existingUser = await User.findOne({ email }).lean();
		if (existingUser) {
			return res.status(409).json({ error: "Email is already registered" });
		}

		const passwordHash = await bcrypt.hash(password, 10);
		await User.create({ email, mobile, passwordHash });

		return res.status(201).json({ message: "Signup successful. Please login." });
	} catch (error) {
		return res.status(500).json({ error: error.message || "Signup failed" });
	}
});

app.post("/api/auth/login", async (req, res) => {
	try {
		if (!MONGO_KEY) {
			return res.status(500).json({ error: "MongoDB is not configured" });
		}

		const email = normalizeEmail(req.body?.email);
		const password = typeof req.body?.password === "string" ? req.body.password : "";

		if (!email || !password) {
			return res.status(400).json({ error: "email and password are required" });
		}

		const user = await User.findOne({ email });
		if (!user) {
			return res.status(401).json({ error: "Invalid email or password" });
		}

		const isValidPassword = await bcrypt.compare(password, user.passwordHash);
		if (!isValidPassword) {
			return res.status(401).json({ error: "Invalid email or password" });
		}

		const token = createAuthToken(String(user._id));
		return res.json({
			token,
			user: {
				id: String(user._id),
				email: user.email,
				mobile: user.mobile,
			},
		});
	} catch (error) {
		return res.status(500).json({ error: error.message || "Login failed" });
	}
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
	try {
		const user = await User.findById(req.userId).select("email mobile createdAt").lean();
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		return res.json({
			user: {
				id: String(user._id),
				email: user.email,
				mobile: user.mobile,
				createdAt: user.createdAt,
			},
		});
	} catch (error) {
		return res.status(500).json({ error: error.message || "Failed to fetch user" });
	}
});

app.post("/api/gemini", requireAuth, async (req, res) => {
	try {
		if (!genAI) {
			return res.status(500).json({ error: "Gemini API key is not configured" });
		}

		const rawPrompt = req.body?.prompt;
		const prompt = typeof rawPrompt === "string" ? rawPrompt.trim() : "";

		if (!prompt) {
			return res.status(400).json({ error: "prompt is required" });
		}

		if (prompt.length > MAX_PROMPT_LENGTH) {
			return res.status(400).json({
				error: `prompt is too long (max ${MAX_PROMPT_LENGTH} characters)`,
			});
		}

		const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
		const result = await model.generateContent(prompt);
		const text = result.response.text();

		if (MONGO_KEY) {
			const extractedTopic = extractTopicFromPrompt(prompt);
			await ChatHistory.create({
				userId: req.userId,
				title: extractedTopic || "Untitled Chat",
				topic: extractedTopic,
				prompt,
				response: text,
			});
		}

		return res.json({ text });
	} catch (error) {
		const message = error?.message || "Gemini request failed";
		const causeMessage = error?.cause?.message;
		return res.status(500).json({ error: causeMessage ? `${message}: ${causeMessage}` : message });
	}
});

connectDatabase().finally(() => {
	app.listen(PORT, () => {
		console.log(`Server running on http://localhost:${PORT}`);
	});
});
