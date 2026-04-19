import { useState } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import Loading from './loading'
import Options from './options'
import Sidebar from './sidebar'
import {
	buildPodcastPromptTemplate,
	normalizeHosts,
	sanitizePodcastInputs,
	TOPIC_DETAILS_MAX_LENGTH,
	TOPIC_MAX_LENGTH,
	validatePodcastInputs,
} from '../utils/promptTemplate'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function Home({ authToken = '', userEmail = 'user@example.com', onLogout = () => {} }) {
	const [topic, setTopic] = useState('')
	const [topicDetails, setTopicDetails] = useState('')
	const [language, setLanguage] = useState('Hinglish')
	const [tone, setTone] = useState('Casual')
	const [hosts, setHosts] = useState(2)
	const [answer, setAnswer] = useState('')
	const [isGenerating, setIsGenerating] = useState(false)
	const [isSidebarOpen, setIsSidebarOpen] = useState(true)

	const handleNewChat = () => {
		setTopic('')
		setTopicDetails('')
		setLanguage('Hinglish')
		setTone('Casual')
		setHosts(2)
		setAnswer('')
	}

	const handleGenerate = async () => {
		const { isValid, errors } = validatePodcastInputs({ topic, topicDetails })

		if (!isValid) {
			setAnswer(`### Validation Error\n\n- ${errors.join('\n- ')}`)
			return
		}

		const safeInputs = sanitizePodcastInputs({
			topic,
			topicDetails,
			language,
			tone,
			hosts,
		})

		setTopic(safeInputs.topic)
		setTopicDetails(safeInputs.topicDetails)
		setLanguage(safeInputs.language)
		setTone(safeInputs.tone)
		setHosts(safeInputs.hosts)

		const templatePrompt = buildPodcastPromptTemplate(safeInputs)

		setIsGenerating(true)
		setAnswer('')

		try {
			const response = await axios.post(
				`${API_BASE_URL}/api/gemini`,
				{
					prompt: templatePrompt,
				},
				{
					headers: authToken
						? {
							Authorization: `Bearer ${authToken}`,
						}
						: undefined,
				}
			)

			const generatedText = response?.data?.text?.trim() || 'No response returned from backend.'
			setAnswer(generatedText)
		} catch (error) {
			const errorMessage = error?.response?.data?.error || error?.message || 'Request failed.'
			setAnswer(`### Error\n\n${errorMessage}`)
		} finally {
			setIsGenerating(false)
		}
	}

	return (
		<div className="min-h-screen bg-white text-zinc-900">
			<Sidebar
				isOpen={isSidebarOpen}
				onClose={() => setIsSidebarOpen(false)}
				onNewChat={handleNewChat}
				onLogout={onLogout}
				userEmail={userEmail}
			/>

			{!isSidebarOpen ? (
				<button
					type="button"
					onClick={() => setIsSidebarOpen(true)}
					className="fixed left-4 top-4 z-20 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-800"
				>
					Menu
				</button>
			) : null}

			<main className={`min-h-screen px-4 py-8 sm:py-10 ${isSidebarOpen ? 'md:pl-[21rem]' : ''}`}>
			{isGenerating ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
					<Loading />
				</div>
			) : null}

			<section className="mx-auto w-full max-w-4xl rounded-xl border border-zinc-300 bg-white p-5 sm:p-6">
				<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">PodCraft Home</h1>
				<p className="mb-5 mt-2 text-sm text-zinc-600 sm:text-base">Enter topic and details, then choose podcast options.</p>

				<label htmlFor="topic-input" className="mb-2 block text-sm font-semibold text-zinc-800 sm:text-base">
					Topic
				</label>
				<input
					id="topic-input"
					type="text"
					className="mb-4 w-full rounded-md border border-black bg-white px-3 py-3 text-base text-zinc-900 outline-none focus:ring-2 focus:ring-black/20"
					placeholder="Example: AI in daily life"
					value={topic}
					onChange={(event) => setTopic(event.target.value)}
					disabled={isGenerating}
					maxLength={TOPIC_MAX_LENGTH}
				/>
				<p className="mb-3 text-xs text-zinc-500">{topic.length}/{TOPIC_MAX_LENGTH}</p>

				<label htmlFor="topic-details" className="mb-2 block text-sm font-semibold text-zinc-800 sm:text-base">
					Topic Details
				</label>
				<textarea
					id="topic-details"
					className="mb-4 w-full resize-y rounded-md border border-black bg-white px-3 py-3 text-base text-zinc-900 outline-none focus:ring-2 focus:ring-black/20"
					placeholder="Add what should be covered in the podcast script..."
					value={topicDetails}
					onChange={(event) => setTopicDetails(event.target.value)}
					disabled={isGenerating}
					maxLength={TOPIC_DETAILS_MAX_LENGTH}
					rows={5}
				/>
				<p className="mb-3 text-xs text-zinc-500">{topicDetails.length}/{TOPIC_DETAILS_MAX_LENGTH}</p>

				<Options
					language={language}
					tone={tone}
					hosts={hosts}
					onLanguageChange={setLanguage}
					onToneChange={setTone}
					onHostsChange={(value) => setHosts(normalizeHosts(value))}
					disabled={isGenerating}
				/>

				<button
					type="button"
					className="mb-5 inline-flex items-center rounded-md border border-black bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70 sm:text-base"
					onClick={handleGenerate}
					disabled={isGenerating}
				>
					{isGenerating ? 'Generating...' : 'Generate Answer'}
				</button>

				<label className="mb-2 block text-sm font-semibold text-zinc-800 sm:text-base">Output</label>
				<section className="min-h-48 rounded-md border border-black bg-white p-4" aria-live="polite">
					{answer ? (
						<ReactMarkdown
							components={{
								h2: ({ children }) => <h2 className="mb-2 text-xl font-semibold">{children}</h2>,
								p: ({ children }) => <p className="mb-3 leading-7">{children}</p>,
								blockquote: ({ children }) => (
									<blockquote className="mb-3 border-l-4 border-zinc-300 pl-3 italic text-zinc-700">{children}</blockquote>
								),
							}}
						>
							{answer}
						</ReactMarkdown>
					) : (
						<p className="leading-7 text-zinc-600">Your generated answer will appear here.</p>
					)}
				</section>
			</section>
			</main>
		</div>
	)
}

export default Home
