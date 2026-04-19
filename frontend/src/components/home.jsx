import { useState } from 'react'
import Loading from './loading'
import Options from './options'
import Sidebar from './sidebar'
import {
	createProjectRequest,
	generateProjectRequest,
	updateProjectRequest,
} from '../features/projects/api/projectsApi'
import { useProjects } from '../features/projects/hooks/useProjects'
import {
	normalizeHosts,
	sanitizePodcastInputs,
	TOPIC_DETAILS_MAX_LENGTH,
	TOPIC_MAX_LENGTH,
	validatePodcastInputs,
} from '../utils/promptTemplate'

function createBlankProject() {
	return {
		id: '',
		projectName: '',
		topic: '',
		details: '',
		language: '',
		tone: '',
		hosts: '',
		prompt: '',
		outputScript: '',
	}
}

function Home({ authToken = '', userEmail = 'user@example.com', onLogout = () => {} }) {
	const [currentProject, setCurrentProject] = useState(createBlankProject())
	const [isGenerating, setIsGenerating] = useState(false)
	const [isSavingProject, setIsSavingProject] = useState(false)
	const [projectActionError, setProjectActionError] = useState('')
	const [isSidebarOpen, setIsSidebarOpen] = useState(true)
	const { projects, isProjectsLoading, projectsError, upsertProject } = useProjects(authToken)

	const projectData = currentProject
	const isBusy = isGenerating || isSavingProject
	const canShowSaveButton = Boolean(projectData.id)

	const updateProjectField = (field, value) => {
		setCurrentProject((previousProject) => {
			const nextProject = {
				...previousProject,
				[field]: value,
			}

			if (!nextProject.projectName && field === 'topic') {
				nextProject.projectName = value
			}

			return nextProject
		})
	}

	const saveProject = async () => {
		setProjectActionError('')

		const payload = {
			projectName: projectData.projectName || projectData.topic || 'Untitled Project',
			topic: projectData.topic,
			details: projectData.details,
			language: projectData.language,
			tone: projectData.tone,
			hosts: projectData.hosts,
			prompt: projectData.prompt,
			outputScript: projectData.outputScript,
		}

		setIsSavingProject(true)
		try {
			if (!projectData.id) {
				return
			}

			const savedProject = projectData.id
				? await updateProjectRequest(authToken, projectData.id, payload)
				: await createProjectRequest(authToken, payload)

			if (savedProject) {
				setCurrentProject(savedProject)
				upsertProject(savedProject)
			}
		} catch (error) {
			setProjectActionError(error?.response?.data?.error || error?.message || 'Failed to save project.')
		} finally {
			setIsSavingProject(false)
		}
	}

	const handleNewChat = () => {
		setCurrentProject(createBlankProject())
		setProjectActionError('')
	}

	const handleSelectProject = (project) => {
		setCurrentProject({ ...project })
		setProjectActionError('')
	}

	const handleGenerate = async () => {
		const { isValid, errors } = validatePodcastInputs({
			topic: projectData.topic,
			topicDetails: projectData.details,
		})

		if (!isValid) {
			updateProjectField('outputScript', `Validation Error:\n- ${errors.join('\n- ')}`)
			return
		}

		const safeInputs = sanitizePodcastInputs({
			topic: projectData.topic,
			topicDetails: projectData.details,
			language: projectData.language,
			tone: projectData.tone,
			hosts: projectData.hosts,
		})

		setIsGenerating(true)
		setProjectActionError('')

		try {
			const savedProject = await generateProjectRequest(authToken, {
				projectId: projectData.id || undefined,
				projectName: projectData.projectName || safeInputs.topic || 'Untitled Project',
				topic: safeInputs.topic,
				details: safeInputs.topicDetails,
				language: safeInputs.language,
				tone: safeInputs.tone,
				hosts: safeInputs.hosts,
			})

			if (savedProject) {
				setCurrentProject(savedProject)
				upsertProject(savedProject)
			}
		} catch (error) {
			const errorMessage = error?.response?.data?.error || error?.message || 'Request failed.'
			updateProjectField('outputScript', `Error:\n${errorMessage}`)
			setProjectActionError(errorMessage)
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
				projects={projects}
				activeProjectId={projectData.id || null}
				onSelectProject={handleSelectProject}
				isHistoryLoading={isProjectsLoading}
				historyError={projectsError}
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
					value={projectData.topic}
					onChange={(event) => updateProjectField('topic', event.target.value)}
					disabled={isGenerating}
					maxLength={TOPIC_MAX_LENGTH}
				/>
				<p className="mb-3 text-xs text-zinc-500">{projectData.topic.length}/{TOPIC_MAX_LENGTH}</p>

				<label htmlFor="topic-details" className="mb-2 block text-sm font-semibold text-zinc-800 sm:text-base">
					Topic Details
				</label>
				<textarea
					id="topic-details"
					className="mb-4 w-full resize-y rounded-md border border-black bg-white px-3 py-3 text-base text-zinc-900 outline-none focus:ring-2 focus:ring-black/20"
					placeholder="Add what should be covered in the podcast script..."
					value={projectData.details}
					onChange={(event) => updateProjectField('details', event.target.value)}
					disabled={isGenerating}
					maxLength={TOPIC_DETAILS_MAX_LENGTH}
					rows={5}
				/>
				<p className="mb-3 text-xs text-zinc-500">{projectData.details.length}/{TOPIC_DETAILS_MAX_LENGTH}</p>

				<Options
					language={projectData.language}
					tone={projectData.tone}
					hosts={projectData.hosts}
					onLanguageChange={(value) => updateProjectField('language', value)}
					onToneChange={(value) => updateProjectField('tone', value)}
					onHostsChange={(value) => updateProjectField('hosts', normalizeHosts(value))}
					disabled={isBusy}
				/>

				<div className="mb-5 flex flex-wrap items-center gap-2">
					<button
						type="button"
						className="inline-flex items-center rounded-md border border-black bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70 sm:text-base"
						onClick={handleGenerate}
						disabled={isBusy}
					>
						{isGenerating ? 'Generating...' : 'Generate Answer'}
					</button>
					{canShowSaveButton ? (
						<button
							type="button"
							className="inline-flex items-center rounded-md border border-zinc-400 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-70 sm:text-base"
							onClick={saveProject}
							disabled={isBusy || (!projectData.topic && !projectData.details && !projectData.outputScript)}
						>
							{isSavingProject ? 'Saving...' : 'Save Project'}
						</button>
					) : null}
				</div>

				{projectActionError ? (
					<p className="mb-4 text-sm text-red-600">{projectActionError}</p>
				) : null}

				<label className="mb-2 block text-sm font-semibold text-zinc-800 sm:text-base">Output</label>
				<textarea
					className="min-h-48 w-full resize-y rounded-md border border-black bg-white p-4 text-base text-zinc-900 outline-none focus:ring-2 focus:ring-black/20"
					aria-live="polite"
					placeholder="Your generated answer will appear here."
					value={projectData.outputScript}
					onChange={(event) => updateProjectField('outputScript', event.target.value)}
					disabled={isGenerating}
					rows={10}
				/>
			</section>
			</main>
		</div>
	)
}

export default Home
