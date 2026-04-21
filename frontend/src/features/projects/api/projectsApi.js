import axios from 'axios'
import API_BASE_URL from '../../../envirnment'

function withAuth(authToken) {
	return {
		headers: {
			Authorization: `Bearer ${authToken}`,
		},
	}
}

export async function fetchUserProjects(authToken, limit = 100) {
	if (!authToken) {
		return []
	}

	const response = await axios.get(`${API_BASE_URL}/api/projects`, {
		params: { limit },
		...withAuth(authToken),
	})

	return response?.data?.projects || []
}

export async function createProjectRequest(authToken, payload) {
	const response = await axios.post(`${API_BASE_URL}/api/projects`, payload, withAuth(authToken))
	return response?.data?.project || null
}

export async function updateProjectRequest(authToken, projectId, payload) {
	const response = await axios.put(`${API_BASE_URL}/api/projects/${projectId}`, payload, withAuth(authToken))
	return response?.data?.project || null
}

export async function generateProjectRequest(authToken, payload) {
	const response = await axios.post(`${API_BASE_URL}/api/projects/generate`, payload, withAuth(authToken))
	return response?.data?.project || null
}
