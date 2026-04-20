import { AnimatePresence, motion } from 'framer-motion'

function ActionPopup({
	isOpen = false,
	title = 'Are you sure?',
	description = '',
	confirmLabel = 'Confirm',
	cancelLabel = 'Cancel',
	onConfirm = () => {},
	onCancel = () => {},
	showCancel = true,
	confirmVariant = 'default',
}) {
	const confirmClassName =
		confirmVariant === 'danger'
			? 'rounded-lg border border-red-200 bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200'
			: 'rounded-lg border border-black bg-black px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800'

	return (
		<AnimatePresence>
			{isOpen ? (
				<>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-[1px]"
						onClick={onCancel}
					/>
					<motion.section
						initial={{ opacity: 0, y: 14, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 10, scale: 0.98 }}
						transition={{ duration: 0.18 }}
						className="fixed left-1/2 top-1/2 z-[71] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl"
					>
						<h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
						{description ? (
							<p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-600">{description}</p>
						) : null}
						<div className="mt-5 flex items-center justify-end gap-2">
							{showCancel ? (
								<button
									type="button"
									onClick={onCancel}
									className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
								>
									{cancelLabel}
								</button>
							) : null}
							<button
								type="button"
								onClick={onConfirm}
								className={confirmClassName}
							>
								{confirmLabel}
							</button>
						</div>
					</motion.section>
				</>
			) : null}
		</AnimatePresence>
	)
}

export default ActionPopup
