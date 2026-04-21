import API_BASE_URL from '../envirnment'

export async function testReactAppConnection() {
	const response = await fetch(`${API_BASE_URL}/`)

	if (!response.ok) {
		throw new Error(`Backend health check failed: ${response.status}`)
	}

	const data = await response.json()
	return {
		apiUrl: API_BASE_URL,
		message: data?.message || 'Backend reachable',
		timestamp: new Date().toISOString(),
	}
}
