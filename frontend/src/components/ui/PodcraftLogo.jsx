function PodcraftLogo({ className = 'w-10 h-10' }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 100 100"
			className={className}
		>
			<defs>
				<linearGradient id="violet" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#e9d5ff" />
					<stop offset="100%" stopColor="#c084fc" />
				</linearGradient>

				<linearGradient id="memento" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="#a8a29e" />
					<stop offset="100%" stopColor="#78716c" />
				</linearGradient>
			</defs>

			<rect
				x="38"
				y="20"
				width="24"
				height="40"
				rx="12"
				fill="url(#violet)"
			/>

			<line x1="38" y1="35" x2="62" y2="35" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5" />
			<line x1="38" y1="45" x2="62" y2="45" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5" />

			<path
				d="M 28 40 v 8 a 22 22 0 0 0 44 0 v -8"
				fill="none"
				stroke="url(#memento)"
				strokeWidth="5"
				strokeLinecap="round"
			/>

			<line
				x1="50"
				y1="70"
				x2="50"
				y2="85"
				stroke="url(#memento)"
				strokeWidth="5"
				strokeLinecap="round"
			/>

			<line
				x1="35"
				y1="85"
				x2="65"
				y2="85"
				stroke="url(#memento)"
				strokeWidth="5"
				strokeLinecap="round"
			/>
		</svg>
	)
}

export default PodcraftLogo
