import { useState } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import Loading from './loading'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function Home() {
	const [inputText, setInputText] = useState('')
	const [answer, setAnswer] = useState('')
	const [isGenerating, setIsGenerating] = useState(false)

	const handleGenerate = async () => {
		const trimmedInput = inputText.trim()

		if (!trimmedInput) {
			setAnswer('Please enter a prompt in the input section first.')
			return
		}

		setIsGenerating(true)
		setAnswer('')

		try {
			const response = await axios.post(`${API_BASE_URL}/api/gemini`, {
				prompt: trimmedInput,
			})

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
		<main className="min-h-screen bg-white px-4 py-8 text-zinc-900 sm:py-10">
			{isGenerating ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
					<Loading />
				</div>
			) : null}

			<section className="mx-auto w-full max-w-4xl rounded-xl border border-zinc-300 bg-white p-5 sm:p-6">
				<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">PodCraft Home</h1>
				<p className="mb-5 mt-2 text-sm text-zinc-600 sm:text-base">Enter your input and generate an answer.</p>

				<label htmlFor="prompt-input" className="mb-2 block text-sm font-semibold text-zinc-800 sm:text-base">
					Input
				</label>
				<textarea
					id="prompt-input"
					className="mb-4 w-full resize-y rounded-md border border-black bg-white px-3 py-3 text-base text-zinc-900 outline-none focus:ring-2 focus:ring-black/20"
					placeholder="Type your prompt here..."
					value={inputText}
					onChange={(event) => setInputText(event.target.value)}
					disabled={isGenerating}
					rows={7}
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
	)
}

export default Home
