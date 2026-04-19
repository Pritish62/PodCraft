import { useState } from 'react'
import { loginRequest, signupRequest } from '../api/authApi'

const TOKEN_STORAGE_KEY = 'podcraft_auth_token'
const USER_STORAGE_KEY = 'podcraft_auth_user'

function getStoredUser() {
	const rawUser = localStorage.getItem(USER_STORAGE_KEY)
	if (!rawUser) {
		return null
	}

	try {
		return JSON.parse(rawUser)
	} catch {
		return null
	}
}

export function useAuth() {
	const [mode, setMode] = useState('login')
	const [authError, setAuthError] = useState('')
	const [authMessage, setAuthMessage] = useState('')
	const [isAuthSubmitting, setIsAuthSubmitting] = useState(false)
	const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || '')
	const [user, setUser] = useState(() => getStoredUser())

	const isAuthenticated = Boolean(token)

	const persistSession = (nextToken, nextUser) => {
		setToken(nextToken)
		setUser(nextUser)
		localStorage.setItem(TOKEN_STORAGE_KEY, nextToken)
		localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser))
	}

	const clearSession = () => {
		setToken('')
		setUser(null)
		localStorage.removeItem(TOKEN_STORAGE_KEY)
		localStorage.removeItem(USER_STORAGE_KEY)
	}

	const switchMode = (nextMode) => {
		setMode(nextMode)
		setAuthError('')
	}

	const signup = async ({ email, mobile, password, confirmPassword }) => {
		setAuthError('')
		setAuthMessage('')

		if (password !== confirmPassword) {
			setAuthError('Password and confirm password must match.')
			return
		}

		setIsAuthSubmitting(true)
		try {
			const data = await signupRequest({ email, mobile, password })
			setAuthMessage(data?.message || 'Signup successful. Please login.')
			setMode('login')
		} catch (error) {
			setAuthError(error?.response?.data?.error || error?.message || 'Signup failed.')
		} finally {
			setIsAuthSubmitting(false)
		}
	}

	const login = async ({ email, password }) => {
		setAuthError('')
		setAuthMessage('')
		setIsAuthSubmitting(true)

		try {
			const data = await loginRequest({ email, password })
			const receivedToken = data?.token || ''
			const receivedUser = data?.user || null

			if (!receivedToken || !receivedUser) {
				setAuthError('Invalid login response from server.')
				return
			}

			persistSession(receivedToken, receivedUser)
		} catch (error) {
			setAuthError(error?.response?.data?.error || error?.message || 'Login failed.')
		} finally {
			setIsAuthSubmitting(false)
		}
	}

	const logout = () => {
		clearSession()
		setMode('login')
		setAuthMessage('You are logged out.')
		setAuthError('')
	}

	return {
		mode,
		authError,
		authMessage,
		isAuthSubmitting,
		token,
		user,
		isAuthenticated,
		switchMode,
		signup,
		login,
		logout,
	}
}
