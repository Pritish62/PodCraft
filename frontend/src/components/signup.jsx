import { useState } from 'react'

function Signup({ onSubmit, onSwitchToLogin, isSubmitting = false, error = '', successMessage = '' }) {
	const [email, setEmail] = useState('')
	const [mobile, setMobile] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [localError, setLocalError] = useState('')

	const handleSubmit = async (event) => {
		event.preventDefault()
		setLocalError('')

		const trimmedEmail = email.trim().toLowerCase()
		const trimmedMobile = mobile.trim()

		if (!trimmedEmail || !trimmedMobile || !password || !confirmPassword) {
			setLocalError('All fields are required.')
			return
		}

		if (password !== confirmPassword) {
			setLocalError('Password and confirm password must match.')
			return
		}

		await onSubmit({
			email: trimmedEmail,
			mobile: trimmedMobile,
			password,
			confirmPassword,
		})
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<label htmlFor="signup-email" className="mb-1 block text-sm font-semibold text-zinc-800">
					Email
				</label>
				<input
					id="signup-email"
					type="email"
					className="w-full rounded-md border border-zinc-300 px-3 py-2.5 outline-none focus:border-black"
					value={email}
					onChange={(event) => setEmail(event.target.value)}
					disabled={isSubmitting}
				/>
			</div>

			<div>
				<label htmlFor="signup-mobile" className="mb-1 block text-sm font-semibold text-zinc-800">
					Mobile Number
				</label>
				<input
					id="signup-mobile"
					type="tel"
					className="w-full rounded-md border border-zinc-300 px-3 py-2.5 outline-none focus:border-black"
					value={mobile}
					onChange={(event) => setMobile(event.target.value)}
					disabled={isSubmitting}
				/>
			</div>

			<div>
				<label htmlFor="signup-password" className="mb-1 block text-sm font-semibold text-zinc-800">
					Password
				</label>
				<input
					id="signup-password"
					type="password"
					className="w-full rounded-md border border-zinc-300 px-3 py-2.5 outline-none focus:border-black"
					value={password}
					onChange={(event) => setPassword(event.target.value)}
					disabled={isSubmitting}
				/>
			</div>

			<div>
				<label htmlFor="signup-confirm-password" className="mb-1 block text-sm font-semibold text-zinc-800">
					Confirm Password
				</label>
				<input
					id="signup-confirm-password"
					type="password"
					className="w-full rounded-md border border-zinc-300 px-3 py-2.5 outline-none focus:border-black"
					value={confirmPassword}
					onChange={(event) => setConfirmPassword(event.target.value)}
					disabled={isSubmitting}
				/>
			</div>

			{localError ? <p className="text-sm text-red-600">{localError}</p> : null}
			{error ? <p className="text-sm text-red-600">{error}</p> : null}
			{successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}

			<button
				type="submit"
				disabled={isSubmitting}
				className="w-full rounded-md border border-black bg-black px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
			>
				{isSubmitting ? 'Creating Account...' : 'Sign Up'}
			</button>

			<p className="text-sm text-zinc-600">
				Already have an account?{' '}
				<button
					type="button"
					onClick={onSwitchToLogin}
					disabled={isSubmitting}
					className="font-semibold text-black underline"
				>
					Login
				</button>
			</p>
		</form>
	)
}

export default Signup
