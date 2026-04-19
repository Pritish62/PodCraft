import { useId } from 'react'
import { motion } from 'framer-motion'

function GooeyInput({ value, onChange, placeholder = 'Search chats...' }) {
	const filterId = useId().replace(/:/g, '')

	return (
		<div className="relative">
			<svg className="pointer-events-none absolute h-0 w-0" aria-hidden="true" focusable="false">
				<defs>
					<filter id={filterId}>
						<feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
						<feColorMatrix
							in="blur"
							mode="matrix"
							values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -11"
							result="goo"
						/>
						<feBlend in="SourceGraphic" in2="goo" />
					</filter>
				</defs>
			</svg>

			<div className="relative" style={{ filter: `url(#${filterId})` }}>
				<motion.span
					aria-hidden="true"
					className="pointer-events-none absolute -left-2 top-1/2 h-3 w-3 rounded-full bg-zinc-200"
					animate={{ y: ['-50%', '-70%', '-50%'], x: [0, 8, 0] }}
					transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
				/>
				<motion.span
					aria-hidden="true"
					className="pointer-events-none absolute -right-2 top-1/2 h-2.5 w-2.5 rounded-full bg-zinc-300"
					animate={{ y: ['-50%', '-35%', '-50%'], x: [0, -8, 0] }}
					transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
				/>

				<input
					type="text"
					value={value}
					onChange={onChange}
					placeholder={placeholder}
					className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none transition focus:border-zinc-400"
				/>
			</div>
		</div>
	)
}

export default GooeyInput
