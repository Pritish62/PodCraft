function normalizeHosts(hosts) {
	const parsedHosts = Number(hosts)

	if (!Number.isFinite(parsedHosts)) {
		return 2
	}

	return Math.min(4, Math.max(1, Math.floor(parsedHosts)))
}

export function buildPodcastPromptTemplate({ topic, topicDetails, language, tone, hosts }) {
	const safeTopic = (topic || '').trim()
	const safeTopicDetails = (topicDetails || '').trim()
	const safeLanguage = (language || 'Hinglish').trim()
	const safeTone = (tone || 'Casual').trim()
	const safeHosts = normalizeHosts(hosts)

	const formatLines = Array.from({ length: safeHosts }, (_, index) => `Host ${index + 1}: ...`).join('\n')

	return [
		'Generate a podcast script.',
		'',
		`Topic: ${safeTopic || 'N/A'}`,
		`Topic Details: ${safeTopicDetails || 'Not provided'}`,
		`Tone: ${safeTone}`,
		`Language: ${safeLanguage}`,
		`Hosts: ${safeHosts}`,
		'',
		'Format:',
		formatLines,
		'',
		'Make it engaging and natural.',
	].join('\n')
}
