const IS_PROD = import.meta.env.PROD
const PROD_SERVER = process.env.VITE_API_URL;
const DEV_SERVER = 'http://localhost:8000'

const server = (IS_PROD ? PROD_SERVER : DEV_SERVER)

export default server
export { IS_PROD }
