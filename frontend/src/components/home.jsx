import { useEffect, useRef, useState } from 'react'
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
		versions: [],
	}
}

function normalizeProjectVersions(project = {}) {
	const incomingVersions = Array.isArray(project.versions) ? project.versions : []
	const normalizedVersions = incomingVersions
		.filter((version) => version && typeof version.versionNumber === 'number')
		.map((version) => ({
			versionNumber: version.versionNumber,
			prompt: version.prompt || '',
			outputScript: version.outputScript || '',
			createdAt: version.createdAt,
		}))
		.sort((a, b) => a.versionNumber - b.versionNumber)

	if (normalizedVersions.length > 0) {
		return normalizedVersions
	}

	if (project.outputScript) {
		return [
			{
				versionNumber: 1,
				prompt: project.prompt || '',
				outputScript: project.outputScript,
				createdAt: project.updatedAt,
			},
		]
	}

	return []
}

function normalizeProjectForUi(project = {}) {
	const normalizedVersions = normalizeProjectVersions(project)
	const latestVersion = normalizedVersions[normalizedVersions.length - 1]
	const resolvedOutputScript =
		typeof project.outputScript === 'string' && project.outputScript.length > 0
			? project.outputScript
			: latestVersion?.outputScript || ''

	return {
		...createBlankProject(),
		...project,
		outputScript: resolvedOutputScript,
		versions: normalizedVersions,
	}
}

function getLatestVersionNumber(versions = []) {
	if (!versions.length) {
		return null
	}

	return versions[versions.length - 1].versionNumber
}

function getSelectionOffsets(container, range) {
	const preRange = range.cloneRange()
	preRange.selectNodeContents(container)
	preRange.setEnd(range.startContainer, range.startOffset)

	const start = preRange.toString().length
	const selectedText = range.toString()
	const end = start + selectedText.length

	return { start, end, selectedText }
}

function Home({ authToken = '', userEmail = 'user@example.com', onLogout = () => {} }) {
	const [currentProject, setCurrentProject] = useState(createBlankProject())
	const [activeVersionNumber, setActiveVersionNumber] = useState(null)
	const [outputViewKey, setOutputViewKey] = useState(0)
	const [isGenerating, setIsGenerating] = useState(false)
	const [isSavingProject, setIsSavingProject] = useState(false)
	const [projectActionError, setProjectActionError] = useState('')
	const [isSidebarOpen, setIsSidebarOpen] = useState(true)
	const [highlightAction, setHighlightAction] = useState({
		isVisible: false,
		x: 0,
		y: 0,
		start: 0,
		end: 0,
		selectedText: '',
		editedText: '',
	})
	const { projects, isProjectsLoading, projectsError, upsertProject } = useProjects(authToken)
	const outputContentRef = useRef(null)
	const outputSurfaceRef = useRef(null)
	const highlightPopupRef = useRef(null)

	const projectData = currentProject
	const projectVersions = normalizeProjectVersions(projectData)
	const isBusy = isGenerating || isSavingProject
	const canShowSaveButton = Boolean(projectData.id)
	const canRegenerate = Boolean(projectData.id)

	useEffect(() => {
		const handleOutsideClick = (event) => {
			if (!highlightAction.isVisible) {
				return
			}

			const clickedInsideEditor = outputContentRef.current?.contains(event.target)
			const clickedInsidePopup = highlightPopupRef.current?.contains(event.target)

			if (!clickedInsideEditor && !clickedInsidePopup) {
				setHighlightAction((previous) => ({ ...previous, isVisible: false }))
			}
		}

		document.addEventListener('mousedown', handleOutsideClick)
		return () => {
			document.removeEventListener('mousedown', handleOutsideClick)
		}
	}, [highlightAction.isVisible])

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

		const normalizedProject = normalizeProjectForUi(projectData)
		const latestVersion = getLatestVersionNumber(normalizedProject.versions)

		const payload = {
			projectName: normalizedProject.topic || normalizedProject.projectName || 'Untitled Project',
			topic: normalizedProject.topic,
			details: normalizedProject.details,
			language: normalizedProject.language,
			tone: normalizedProject.tone,
			hosts: normalizedProject.hosts,
			prompt: normalizedProject.prompt,
			outputScript: normalizedProject.outputScript,
		}

		setIsSavingProject(true)
		try {
			if (!normalizedProject.id) {
				return
			}

			const savedProject = await updateProjectRequest(authToken, normalizedProject.id, payload)

			if (savedProject) {
				const nextProject = normalizeProjectForUi(savedProject)
				setCurrentProject(nextProject)
				setActiveVersionNumber(latestVersion)
				upsertProject(nextProject)
			}
		} catch (error) {
			setProjectActionError(error?.response?.data?.error || error?.message || 'Failed to save project.')
		} finally {
			setIsSavingProject(false)
		}
	}

	const handleNewChat = () => {
		setCurrentProject(createBlankProject())
		setActiveVersionNumber(null)
		setOutputViewKey((previous) => previous + 1)
		setProjectActionError('')
	}

	const handleSelectProject = (project) => {
		const nextProject = normalizeProjectForUi(project)
		setCurrentProject(nextProject)
		setActiveVersionNumber(getLatestVersionNumber(nextProject.versions))
		setOutputViewKey((previous) => previous + 1)
		setProjectActionError('')
		setHighlightAction((previous) => ({ ...previous, isVisible: false }))
	}

	const handleGenerate = async () => {
		const { isValid, errors } = validatePodcastInputs({
			topic: projectData.topic,
			topicDetails: projectData.details,
		})

		if (!isValid) {
			updateProjectField('outputScript', `Validation Error:\n- ${errors.join('\n- ')}`)
			setHighlightAction((previous) => ({ ...previous, isVisible: false }))
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
				const nextProject = normalizeProjectForUi(savedProject)
				setCurrentProject(nextProject)
				setActiveVersionNumber(getLatestVersionNumber(nextProject.versions))
				setOutputViewKey((previous) => previous + 1)
				upsertProject(nextProject)
				setHighlightAction((previous) => ({ ...previous, isVisible: false }))
			}
		} catch (error) {
			const errorMessage = error?.response?.data?.error || error?.message || 'Request failed.'
			updateProjectField('outputScript', `Error:\n${errorMessage}`)
			setProjectActionError(errorMessage)
			setHighlightAction((previous) => ({ ...previous, isVisible: false }))
		} finally {
			setIsGenerating(false)
		}
	}

	const handleSelectionChange = () => {
		if (!outputContentRef.current || !outputSurfaceRef.current) {
			return
		}

		const selection = window.getSelection()
		if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
			setHighlightAction((previous) => ({ ...previous, isVisible: false }))
			return
		}

		const range = selection.getRangeAt(0)
		if (!outputContentRef.current.contains(range.commonAncestorContainer)) {
			setHighlightAction((previous) => ({ ...previous, isVisible: false }))
			return
		}

		const offsets = getSelectionOffsets(outputContentRef.current, range)
		if (!offsets.selectedText.trim()) {
			setHighlightAction((previous) => ({ ...previous, isVisible: false }))
			return
		}

		const selectionRect = range.getBoundingClientRect()
		const surfaceRect = outputSurfaceRef.current.getBoundingClientRect()
		const rawX = selectionRect.left - surfaceRect.left + selectionRect.width / 2
		const rawY = selectionRect.top - surfaceRect.top - 10
		const x = Math.min(surfaceRect.width - 20, Math.max(20, rawX))
		const y = Math.max(8, rawY)

		setHighlightAction({
			isVisible: true,
			x,
			y,
			start: offsets.start,
			end: offsets.end,
			selectedText: offsets.selectedText,
			editedText: offsets.selectedText,
		})
	}

	const applyHighlightEdit = () => {
		if (!highlightAction.isVisible) {
			return
		}

		const sourceText = projectData.outputScript || ''
		const nextText =
			sourceText.slice(0, highlightAction.start) +
			highlightAction.editedText +
			sourceText.slice(highlightAction.end)

		updateProjectField('outputScript', nextText)
		setOutputViewKey((previous) => previous + 1)
		setActiveVersionNumber(null)
		setHighlightAction((previous) => ({ ...previous, isVisible: false }))
	}

	const handleSelectVersion = (versionNumber) => {
		const selectedVersion = projectVersions.find((version) => version.versionNumber === versionNumber)
		if (!selectedVersion) {
			return
		}

		updateProjectField('outputScript', selectedVersion.outputScript || '')
		setActiveVersionNumber(selectedVersion.versionNumber)
		setOutputViewKey((previous) => previous + 1)
		setHighlightAction((previous) => ({ ...previous, isVisible: false }))

		const selection = window.getSelection()
		if (selection) {
			selection.removeAllRanges()
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
								{isGenerating ? (canRegenerate ? 'Regenerating...' : 'Generating...') : (canRegenerate ? 'Regenerate' : 'Generate Answer')}
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

						{projectVersions.length > 0 ? (
							<div className="mb-4 flex flex-wrap items-center gap-2">
								{projectVersions.map((version) => {
									const isActive = activeVersionNumber === version.versionNumber

									return (
										<button
											key={`version-${version.versionNumber}`}
											type="button"
											onClick={() => handleSelectVersion(version.versionNumber)}
											className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition ${
												isActive
													? 'border-black bg-black text-white'
													: 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 hover:bg-zinc-100'
											}`}
										>
											v{version.versionNumber}
										</button>
									)
								})}
							</div>
						) : null}

						<div
							ref={outputSurfaceRef}
							className="relative min-h-[280px] rounded-2xl border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white p-4 sm:p-5"
						>
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
								<>
									<AnimatePresence mode="wait" initial={false}>
										<motion.div
											key={`output-view-${outputViewKey}`}
											initial={{ opacity: 0, y: 8 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -8 }}
											transition={{ duration: 0.22 }}
										>
											{!projectData.outputScript ? (
												<p className="pointer-events-none mb-2 text-sm leading-7 text-zinc-500">
													Your generated script will appear here.
												</p>
											) : null}
											<div
												ref={outputContentRef}
												onMouseUp={handleSelectionChange}
												className="min-h-[220px] whitespace-pre-wrap rounded-xl border border-transparent p-2 text-[15px] leading-7 text-zinc-700"
											>
												{projectData.outputScript}
											</div>
										</motion.div>
									</AnimatePresence>

									<AnimatePresence>
										{highlightAction.isVisible ? (
											<motion.div
												ref={highlightPopupRef}
												initial={{ opacity: 0, y: 6, scale: 0.96 }}
												animate={{ opacity: 1, y: 0, scale: 1 }}
												exit={{ opacity: 0, y: 6, scale: 0.96 }}
												transition={{ duration: 0.18 }}
												className="absolute z-20 w-72 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl"
												style={{ left: highlightAction.x, top: highlightAction.y, transform: 'translate(-50%, -100%)' }}
											>
												<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Edit selection</p>
												<textarea
													className="mb-2 w-full resize-none rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
													rows={3}
													value={highlightAction.editedText}
													onChange={(event) => {
														const nextValue = event.target.value
														setHighlightAction((previous) => ({ ...previous, editedText: nextValue }))
													}}
												/>
												<div className="flex items-center justify-end gap-2">
													<button
														type="button"
														onClick={() => setHighlightAction((previous) => ({ ...previous, isVisible: false }))}
														className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
													>
														Cancel
													</button>
													<button
														type="button"
														onClick={applyHighlightEdit}
														className="rounded-md border border-black bg-black px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800"
													>
														Apply
													</button>
												</div>
											</motion.div>
										) : null}
									</AnimatePresence>
								</>
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
