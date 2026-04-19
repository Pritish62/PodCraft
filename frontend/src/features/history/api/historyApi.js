import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function fetchUserHistory(authToken, limit = 50) {
	if (!authToken) {
		return []
	}

	const response = await axios.get(`${API_BASE_URL}/api/history`, {
		params: { limit },
		headers: {
			Authorization: `Bearer ${authToken}`,
		},
	})

	return response?.data?.history || []
}
