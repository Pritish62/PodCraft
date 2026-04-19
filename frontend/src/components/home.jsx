import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Loading from './loading'
import Options from './options'
import Sidebar from './sidebar'
import {
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

const outputContainerVariants = {
	hidden: { opacity: 0, y: 12 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.25,
			staggerChildren: 0.05,
			delayChildren: 0.06,
		},
	},
}

const outputLineVariants = {
	hidden: { opacity: 0, y: 8 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.2 },
	},
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

			if (field === 'topic') {
				const shouldSyncTitle =
					!previousProject.id ||
					!previousProject.projectName ||
					previousProject.projectName === previousProject.topic

				if (shouldSyncTitle) {
					nextProject.projectName = value
				}
			}

			return nextProject
		})
	}

	const saveProject = async () => {
		setProjectActionError('')

		const payload = {
			projectName: projectData.topic || projectData.projectName || 'Untitled Project',
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

			const savedProject = await updateProjectRequest(authToken, projectData.id, payload)

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
				projectName: safeInputs.topic || projectData.projectName || 'Untitled Project',
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

	const outputLines = projectData.outputScript.split('\n')

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

			<section className="mx-auto w-full max-w-7xl">
				<div className="mb-6 rounded-2xl border border-zinc-200 bg-gradient-to-r from-zinc-50 via-white to-zinc-50 p-5 sm:p-6">
					<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Podcast Script Workspace</h1>
					<p className="mt-2 text-sm text-zinc-600 sm:text-base">
						Write podcast scripts at light speed.
					</p>
				</div>

				<div className="grid gap-6 xl:grid-cols-[1.05fr_1fr]">
					<article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-6">
						<div className="mb-5">
							<h2 className="text-xl font-semibold text-zinc-900 sm:text-2xl">Project Brief</h2>
						</div>

						<label htmlFor="topic-input" className="mb-2 block text-sm font-semibold text-zinc-800">
							Topic
						</label>
						<input
							id="topic-input"
							type="text"
							className="mb-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-4 focus:ring-zinc-200/70"
							placeholder="Example: AI in daily life"
							value={projectData.topic}
							onChange={(event) => updateProjectField('topic', event.target.value)}
							disabled={isGenerating}
							maxLength={TOPIC_MAX_LENGTH}
						/>
						<div className="mb-5 flex justify-end text-xs text-zinc-500">{projectData.topic.length}/{TOPIC_MAX_LENGTH}</div>

						<label htmlFor="topic-details" className="mb-2 block text-sm font-semibold text-zinc-800">
							Topic Details
						</label>
						<textarea
							id="topic-details"
							className="mb-2 w-full resize-y rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-4 focus:ring-zinc-200/70"
							placeholder="Add context, structure, audience and key points for your script..."
							value={projectData.details}
							onChange={(event) => updateProjectField('details', event.target.value)}
							disabled={isGenerating}
							maxLength={TOPIC_DETAILS_MAX_LENGTH}
							rows={7}
						/>
						<div className="mb-5 flex justify-end text-xs text-zinc-500">{projectData.details.length}/{TOPIC_DETAILS_MAX_LENGTH}</div>

						<Options
							language={projectData.language}
							tone={projectData.tone}
							hosts={projectData.hosts}
							onLanguageChange={(value) => updateProjectField('language', value)}
							onToneChange={(value) => updateProjectField('tone', value)}
							onHostsChange={(value) => updateProjectField('hosts', normalizeHosts(value))}
							disabled={isBusy}
						/>

						<div className="mt-6 flex flex-wrap items-center gap-2">
							<button
								type="button"
								className="inline-flex items-center rounded-xl border border-black bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70 sm:text-base"
								onClick={handleGenerate}
								disabled={isBusy}
							>
								{isGenerating ? 'Generating...' : 'Generate Answer'}
							</button>
							{canShowSaveButton ? (
								<button
									type="button"
									className="inline-flex items-center rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-70 sm:text-base"
									onClick={saveProject}
									disabled={isBusy || (!projectData.topic && !projectData.details && !projectData.outputScript)}
								>
									{isSavingProject ? 'Saving...' : 'Save Project'}
								</button>
							) : null}
						</div>

						{projectActionError ? (
							<p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{projectActionError}</p>
						) : null}
					</article>

					<article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-6">
						<div className="mb-5 flex items-center justify-between">
							<div>
								<h2 className="text-xl font-semibold text-zinc-900 sm:text-2xl">Output</h2>
							</div>
							<span className={`rounded-full px-3 py-1 text-xs font-medium ${isGenerating ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
								{isGenerating ? 'Generating' : 'Ready'}
							</span>
						</div>

						<div className="min-h-[280px] rounded-2xl border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white p-4 sm:p-5">
							{isGenerating ? (
								<motion.div
									initial={{ opacity: 0.4 }}
									animate={{ opacity: [0.4, 1, 0.4] }}
									transition={{ duration: 1.2, repeat: Infinity }}
									className="space-y-3"
								>
									<div className="h-4 w-4/5 rounded bg-zinc-200" />
									<div className="h-4 w-full rounded bg-zinc-200" />
									<div className="h-4 w-11/12 rounded bg-zinc-200" />
									<div className="h-4 w-3/4 rounded bg-zinc-200" />
								</motion.div>
							) : (
								<AnimatePresence mode="wait">
									{projectData.outputScript ? (
										<motion.div
											key={projectData.outputScript}
											variants={outputContainerVariants}
											initial="hidden"
											animate="visible"
											exit="hidden"
											className="space-y-2"
										>
											{outputLines.map((line, index) => (
												line.trim() ? (
													<motion.p
														key={`${index}-${line.slice(0, 20)}`}
														variants={outputLineVariants}
														className="whitespace-pre-wrap text-[15px] leading-7 text-zinc-700"
													>
														{line}
													</motion.p>
												) : (
													<div key={`blank-${index}`} className="h-3" />
												)
											))}
										</motion.div>
									) : (
										<motion.p
											key="empty-output"
											initial={{ opacity: 0, y: 8 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -8 }}
											className="text-sm leading-7 text-zinc-500"
										>
											Your generated script will appear here.
										</motion.p>
									)}
								</AnimatePresence>
							)}
						</div>
					</article>
				</div>
			</section>
			</main>
		</div>
	)
}

export default Home
