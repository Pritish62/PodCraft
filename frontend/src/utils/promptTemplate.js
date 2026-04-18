export const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Hinglish']
export const TONE_OPTIONS = ['Educational', 'Casual', 'Humorous']

export const TOPIC_MAX_LENGTH = 120
export const TOPIC_DETAILS_MAX_LENGTH = 1200

const DEFAULT_LANGUAGE = 'Hinglish'
const DEFAULT_TONE = 'Casual'
const DEFAULT_HOSTS = 2

function normalizeText(value) {
	if (typeof value !== 'string') {
		return ''
	}

	return value.replace(/\s+/g, ' ').trim()
}

function clampText(value, maxLength) {
	if (value.length <= maxLength) {
		return value
	}

	return value.slice(0, maxLength).trim()
}

function normalizeChoice(value, allowedOptions, fallback) {
	if (typeof value !== 'string') {
		return fallback
	}

	const trimmedValue = value.trim()
	return allowedOptions.includes(trimmedValue) ? trimmedValue : fallback
}

export function normalizeHosts(hosts) {
	const parsedHosts = Number(hosts)

	if (!Number.isFinite(parsedHosts)) {
		return DEFAULT_HOSTS
	}

	return Math.min(4, Math.max(1, Math.floor(parsedHosts)))
}

export function sanitizePodcastInputs({ topic, topicDetails, language, tone, hosts }) {
	const safeTopic = clampText(normalizeText(topic), TOPIC_MAX_LENGTH)
	const safeTopicDetails = clampText(normalizeText(topicDetails), TOPIC_DETAILS_MAX_LENGTH)
	const safeLanguage = normalizeChoice(language, LANGUAGE_OPTIONS, DEFAULT_LANGUAGE)
	const safeTone = normalizeChoice(tone, TONE_OPTIONS, DEFAULT_TONE)
	const safeHosts = normalizeHosts(hosts)

	return {
		topic: safeTopic,
		topicDetails: safeTopicDetails,
		language: safeLanguage,
		tone: safeTone,
		hosts: safeHosts,
	}
}

export function validatePodcastInputs({ topic, topicDetails }) {
	const rawTopic = typeof topic === 'string' ? topic : ''
	const rawTopicDetails = typeof topicDetails === 'string' ? topicDetails : ''
	const trimmedTopic = rawTopic.trim()
	const trimmedTopicDetails = rawTopicDetails.trim()
	const errors = []

	if (!trimmedTopic) {
		errors.push('Topic is required.')
	}

	if (trimmedTopic.length > TOPIC_MAX_LENGTH) {
		errors.push(`Topic must be at most ${TOPIC_MAX_LENGTH} characters.`)
	}

	if (trimmedTopicDetails.length > TOPIC_DETAILS_MAX_LENGTH) {
		errors.push(`Topic Details must be at most ${TOPIC_DETAILS_MAX_LENGTH} characters.`)
	}

	return {
		isValid: errors.length === 0,
		errors,
	}
}

export function buildPodcastPromptTemplate(inputs) {
	const { topic, topicDetails, language, tone, hosts } = sanitizePodcastInputs(inputs)

	const formatLines = Array.from({ length: hosts }, (_, index) => `Host ${index + 1}: ...`).join('\n')

	return [
		'Generate a podcast script.',
		'',
		`Topic: ${topic || 'N/A'}`,
		`Topic Details: ${topicDetails || 'Not provided'}`,
		`Tone: ${tone}`,
		`Language: ${language}`,
		`Hosts: ${hosts}`,
		'',
		'Format:',
		formatLines,
		'',
		'Make it engaging and natural.',
	].join('\n')
}
