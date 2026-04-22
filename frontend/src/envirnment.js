const IS_PROD = import.meta.env.PROD
const PROD_SERVER = typeof import.meta.env.VITE_API_URL === 'string' ? import.meta.env.VITE_API_URL.trim() : ''
const DEV_SERVER = 'http://localhost:8000'
const PROD_FALLBACK_SERVER = 'https://podcraft-2-87df.onrender.com'

function normalizeServerUrl(url) {
	return String(url || '').replace(/\/+$/, '')
}

const selectedServer = IS_PROD ? (PROD_SERVER || PROD_FALLBACK_SERVER) : DEV_SERVER
const server = normalizeServerUrl(selectedServer)

if (IS_PROD && !PROD_SERVER) {
	console.warn('VITE_API_URL is missing. Falling back to default production backend URL.')
}

export default server
export { IS_PROD }
