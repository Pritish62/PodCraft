import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import GooeyInput from './ui/gooey-input'
import PodcraftLogo from './ui/PodcraftLogo'

function LogoutIcon() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
			<path
				d="M15 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3m-5-5l-4-4m0 0l4-4m-4 4h12"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

function Sidebar({
	isOpen = true,
	onClose,
	onNewChat,
	onLogout,
	projects = [],
	activeProjectId = null,
	onSelectProject,
	isHistoryLoading = false,
	historyError = '',
	userEmail = 'user@example.com',
}) {
	const [searchValue, setSearchValue] = useState('')
	const normalizedChats = projects.map((chat, index) => {
		if (typeof chat === 'string') {
			return { id: `dummy-${index}`, title: chat }
		}

		const topicTitle = typeof chat.topic === 'string' ? chat.topic.trim() : ''
		const projectTitle = typeof chat.projectName === 'string' ? chat.projectName.trim() : ''
		const historyTitle = typeof chat.title === 'string' ? chat.title.trim() : ''

		return {
			id: chat.id || `history-${index}`,
			title: topicTitle || projectTitle || historyTitle || 'Untitled Project',
			raw: chat,
		}
	})

	const filteredChats = normalizedChats.filter((chat) =>
		chat.title.toLowerCase().includes(searchValue.trim().toLowerCase())
	)

	return (
		<AnimatePresence>
			{isOpen ? (
				<>
					<motion.button
						type="button"
						onClick={onClose}
						className="fixed inset-0 z-30 bg-black/10 md:hidden"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					/>

					<motion.aside
						initial={{ x: '-100%' }}
						animate={{ x: 0 }}
						exit={{ x: '-100%' }}
						transition={{ type: 'spring', stiffness: 300, damping: 32 }}
						className="fixed left-0 top-0 z-40 h-screen w-80 border-r border-zinc-200 bg-[#F3F3F3]"
					>
						<div className="relative h-full px-4 pb-24 pt-5">
							<div className="mb-6">
								<div className="mb-4 flex items-center justify-between">
									<div className="flex items-center gap-2">
										<PodcraftLogo className="h-8 w-8" />
										<h1 className="text-2xl font-bold tracking-tight text-zinc-900">Podcraft</h1>
									</div>
									{onClose ? (
										<button
											type="button"
											onClick={onClose}
											className="rounded-md border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-600 hover:border-zinc-400 md:hidden"
										>
											Close
										</button>
									) : null}
								</div>

								<motion.button
									type="button"
									onClick={onNewChat}
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.95 }}
									className="w-full cursor-pointer rounded-xl bg-black px-3 py-2.5 text-sm font-semibold text-white"
								>
									+ New Project
								</motion.button>
							</div>

							<div className="mb-5">
								<GooeyInput
									value={searchValue}
									onValueChange={setSearchValue}
									placeholder="Search recent projects"
								/>
							</div>

							<div className="h-[calc(100%-154px)] overflow-y-auto pr-1">
								<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Recent Projects</p>
								{isHistoryLoading ? (
									<p className="px-1 py-2 text-sm text-zinc-500">Loading history...</p>
								) : null}
								{historyError ? (
									<p className="px-1 py-2 text-sm text-red-600">{historyError}</p>
								) : null}
								{!isHistoryLoading && !historyError && filteredChats.length === 0 ? (
									<p className="px-1 py-2 text-sm text-zinc-500">No projects yet. Generate your first podcast script.</p>
								) : null}
								{!isHistoryLoading && !historyError ? (
									<ul className="space-y-1">
										{filteredChats.map((chat) => (
											<li key={chat.id}>
												<button
													type="button"
													onClick={() => onSelectProject?.(chat.raw || chat)}
													className={`w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm transition ${
														activeProjectId === chat.id
															? 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300'
															: 'text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900'
													}`}
												>
													<span className="block truncate">{chat.title}</span>
												</button>
											</li>
										))}
									</ul>
								) : null}
							</div>

							<div className="absolute bottom-0 left-0 right-0 border-t border-zinc-200 bg-[#F3F3F3] px-4 py-3">
								<div className="flex items-center gap-3">
									<img
										src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80&auto=format&fit=crop"
										alt="User avatar"
										className="h-9 w-9 rounded-full border border-zinc-200 object-cover"
									/>
									<p className="flex-1 truncate text-sm text-zinc-700">{userEmail}</p>
									<motion.button
										type="button"
										onClick={onLogout}
										whileHover={{ scale: 1.08 }}
										whileTap={{ scale: 0.95 }}
										className="rounded-md p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
										aria-label="Logout"
									>
										<LogoutIcon />
									</motion.button>
								</div>
							</div>
						</div>
					</motion.aside>
				</>
			) : null}
		</AnimatePresence>
	)
}

export default Sidebar
