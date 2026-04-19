import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function signupRequest({ email, mobile, password }) {
	const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, {
		email,
		mobile,
		password,
	})
	return response.data
}

export async function loginRequest({ email, password }) {
	const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
		email,
		password,
	})
	return response.data
}
