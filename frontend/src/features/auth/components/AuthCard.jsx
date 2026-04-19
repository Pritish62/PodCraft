import Login from '../../../components/login'
import Signup from '../../../components/signup'

function AuthCard({ mode, authError, authMessage, isAuthSubmitting, onSwitchMode, onSignup, onLogin }) {
	return (
		<main className="min-h-screen bg-white px-4 py-8 text-zinc-900 sm:py-10">
			<section className="mx-auto w-full max-w-md rounded-xl border border-zinc-300 bg-white p-5 sm:p-6">
				<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">PodCraft Auth</h1>
				<p className="mb-5 mt-2 text-sm text-zinc-600">
					Create an account or login to generate podcast scripts.
				</p>

				<div className="mb-4 flex gap-2">
					<button
						type="button"
						onClick={() => onSwitchMode('login')}
						className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${
							mode === 'login' ? 'border-black bg-black text-white' : 'border-zinc-300 bg-white text-zinc-700'
						}`}
					>
						Login
					</button>
					<button
						type="button"
						onClick={() => onSwitchMode('signup')}
						className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${
							mode === 'signup' ? 'border-black bg-black text-white' : 'border-zinc-300 bg-white text-zinc-700'
						}`}
					>
						Sign Up
					</button>
				</div>

				{mode === 'signup' ? (
					<Signup
						onSubmit={onSignup}
						onSwitchToLogin={() => onSwitchMode('login')}
						isSubmitting={isAuthSubmitting}
						error={authError}
						successMessage={authMessage}
					/>
				) : (
					<Login
						onSubmit={onLogin}
						onSwitchToSignup={() => onSwitchMode('signup')}
						isSubmitting={isAuthSubmitting}
						error={authError}
					/>
				)}
			</section>
		</main>
	)
}

export default AuthCard
