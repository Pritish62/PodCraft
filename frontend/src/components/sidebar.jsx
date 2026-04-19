import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import GooeyInput from './ui/gooey-input'

const DUMMY_CHATS = [
	'AI tools for students',
	'Podcast intro ideas',
	'Daily productivity hacks',
	'Future of content creators',
	'How to grow an audience',
]

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
	chatHistory = DUMMY_CHATS,
	userEmail = 'user@example.com',
}) {
	const [searchValue, setSearchValue] = useState('')

	const filteredChats = chatHistory.filter((chat) =>
		chat.toLowerCase().includes(searchValue.trim().toLowerCase())
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
						className="fixed left-0 top-0 z-40 h-screen w-80 border-r border-zinc-200 bg-white"
					>
						<div className="relative h-full px-4 pb-24 pt-5">
							<div className="mb-6">
								<div className="mb-4 flex items-center justify-between">
									<h1 className="text-2xl font-bold tracking-tight text-zinc-900">Podcraft</h1>
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
									className="w-full rounded-xl bg-black px-3 py-2.5 text-sm font-semibold text-white"
								>
									+ New Chat
								</motion.button>
							</div>

							<div className="mb-5">
								<GooeyInput
									value={searchValue}
									onChange={(event) => setSearchValue(event.target.value)}
									placeholder="Search chat history"
								/>
							</div>

							<div className="h-[calc(100%-154px)] overflow-y-auto pr-1">
								<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Chat History</p>
								{/* TODO: Fetch and map chat history data from MongoDB. */}
								<ul className="space-y-1">
									{filteredChats.map((chatTitle) => (
										<li key={chatTitle}>
											<button
												type="button"
												className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900"
											>
												{chatTitle}
											</button>
										</li>
									))}
								</ul>
							</div>

							<div className="absolute bottom-0 left-0 right-0 border-t border-zinc-200 bg-white px-4 py-3">
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
