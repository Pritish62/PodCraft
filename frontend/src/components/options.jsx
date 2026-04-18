import { useEffect, useRef, useState } from 'react'

const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Hinglish']
const TONE_OPTIONS = ['Educational', 'Casual', 'Humorous']
const HOST_OPTIONS = [1, 2, 3, 4]

function ChevronIcon({ isOpen }) {
	return (
		<svg
			viewBox="0 0 20 20"
			aria-hidden="true"
			className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
		>
			<path
				d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.1 1.02l-4.25 4.5a.75.75 0 01-1.1 0l-4.25-4.5a.75.75 0 01.02-1.06z"
				fill="currentColor"
			/>
		</svg>
	)
}

function OptionDropdown({
	id,
	label,
	selectedValue,
	options,
	onSelect,
	isOpen,
	onToggle,
	disabled = false,
	formatOption,
}) {
	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => onToggle(id)}
				disabled={disabled}
				className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
					isOpen
						? 'border-black bg-black text-white'
						: 'border-zinc-300 bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
				} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
			>
				<span>{label}: {selectedValue}</span>
				<ChevronIcon isOpen={isOpen} />
			</button>

			{isOpen ? (
				<div className="absolute left-0 top-full z-20 mt-2 min-w-52 rounded-2xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-100 shadow-xl">
					<p className="mb-1 px-2 py-1 text-xs uppercase tracking-wide text-zinc-400">{label}</p>
					{options.map((option) => {
						const isSelected = option === selectedValue
						const displayValue = formatOption ? formatOption(option) : option

						return (
							<button
								key={option}
								type="button"
								onClick={() => onSelect(option)}
								className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
									isSelected ? 'bg-zinc-700 text-white' : 'text-zinc-200 hover:bg-zinc-800'
								}`}
							>
								<span>{displayValue}</span>
								{isSelected ? <span className="text-[11px] text-zinc-300">Selected</span> : null}
							</button>
						)
					})}
				</div>
			) : null}
		</div>
	)
}

function Options({ language, tone, hosts, onLanguageChange, onToneChange, onHostsChange, disabled = false }) {
	const [openMenu, setOpenMenu] = useState(null)
	const rootRef = useRef(null)

	useEffect(() => {
		if (!openMenu) {
			return undefined
		}

		const handleOutsideClick = (event) => {
			if (rootRef.current && !rootRef.current.contains(event.target)) {
				setOpenMenu(null)
			}
		}

		document.addEventListener('mousedown', handleOutsideClick)
		return () => {
			document.removeEventListener('mousedown', handleOutsideClick)
		}
	}, [openMenu])

	const toggleMenu = (menuId) => {
		if (disabled) {
			return
		}
		setOpenMenu((current) => (current === menuId ? null : menuId))
	}

	const handleSelect = (callback, value) => {
		callback(value)
		setOpenMenu(null)
	}

	return (
		<section ref={rootRef} className="mb-5 flex flex-wrap items-center gap-2">
			<OptionDropdown
				id="language"
				label="Language"
				selectedValue={language}
				options={LANGUAGE_OPTIONS}
				onSelect={(value) => handleSelect(onLanguageChange, value)}
				isOpen={openMenu === 'language'}
				onToggle={toggleMenu}
				disabled={disabled}
			/>
			<OptionDropdown
				id="tone"
				label="Tone"
				selectedValue={tone}
				options={TONE_OPTIONS}
				onSelect={(value) => handleSelect(onToneChange, value)}
				isOpen={openMenu === 'tone'}
				onToggle={toggleMenu}
				disabled={disabled}
			/>
			<OptionDropdown
				id="hosts"
				label="Hosts"
				selectedValue={hosts}
				options={HOST_OPTIONS}
				onSelect={(value) => handleSelect(onHostsChange, value)}
				isOpen={openMenu === 'hosts'}
				onToggle={toggleMenu}
				disabled={disabled}
				formatOption={(value) => `${value} Host${value > 1 ? 's' : ''}`}
			/>
		</section>
	)
}

export default Options