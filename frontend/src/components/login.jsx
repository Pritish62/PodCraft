import { useState } from 'react'

function Login({ onSubmit, onSwitchToSignup, isSubmitting = false, error = '' }) {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [localError, setLocalError] = useState('')

	const handleSubmit = async (event) => {
		event.preventDefault()
		setLocalError('')

		const trimmedEmail = email.trim().toLowerCase()
		if (!trimmedEmail || !password) {
			setLocalError('Email and password are required.')
			return
		}

		await onSubmit({
			email: trimmedEmail,
			password,
		})
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<label htmlFor="login-email" className="mb-1 block text-sm font-semibold text-zinc-800">
					Email
				</label>
				<input
					id="login-email"
					type="email"
					className="w-full rounded-md border border-zinc-300 px-3 py-2.5 outline-none focus:border-black"
					value={email}
					onChange={(event) => setEmail(event.target.value)}
					disabled={isSubmitting}
				/>
			</div>

			<div>
				<label htmlFor="login-password" className="mb-1 block text-sm font-semibold text-zinc-800">
					Password
				</label>
				<input
					id="login-password"
					type="password"
					className="w-full rounded-md border border-zinc-300 px-3 py-2.5 outline-none focus:border-black"
					value={password}
					onChange={(event) => setPassword(event.target.value)}
					disabled={isSubmitting}
				/>
			</div>

			{localError ? <p className="text-sm text-red-600">{localError}</p> : null}
			{error ? <p className="text-sm text-red-600">{error}</p> : null}

			<button
				type="submit"
				disabled={isSubmitting}
				className="w-full rounded-md border border-black bg-black px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
			>
				{isSubmitting ? 'Logging In...' : 'Login'}
			</button>

			<p className="text-sm text-zinc-600">
				Don't have an account?{' '}
				<button
					type="button"
					onClick={onSwitchToSignup}
					disabled={isSubmitting}
					className="font-semibold text-black underline"
				>
					Sign up
				</button>
			</p>
		</form>
	)
}

export default Login
