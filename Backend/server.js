require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT) || 8000;
const GEMINI_API_KEY = (process.env.KEY || "").trim();
const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim() || "gemini-2.5-flash";
const MAX_PROMPT_LENGTH = Number(process.env.MAX_PROMPT_LENGTH) || 8000;

if (!GEMINI_API_KEY) {
	console.warn("KEY is missing in environment variables.");
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

app.get("/", (req, res) => {
	res.json({ message: "Backend server is running" });
});

app.post("/api/gemini", async (req, res) => {
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

		return res.json({ text });
	} catch (error) {
		const message = error?.message || "Gemini request failed";
		const causeMessage = error?.cause?.message;
		return res.status(500).json({ error: causeMessage ? `${message}: ${causeMessage}` : message });
	}
});

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
