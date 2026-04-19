import { useCallback, useEffect, useState } from 'react'
import { fetchUserHistory } from '../api/historyApi'

export function useChatHistory(authToken) {
	const [historyItems, setHistoryItems] = useState([])
	const [isHistoryLoading, setIsHistoryLoading] = useState(false)
	const [historyError, setHistoryError] = useState('')

	const refreshHistory = useCallback(async () => {
		if (!authToken) {
			setHistoryItems([])
			setHistoryError('')
			return
		}

		setIsHistoryLoading(true)
		setHistoryError('')

		try {
			const items = await fetchUserHistory(authToken)
			setHistoryItems(items)
		} catch (error) {
			setHistoryError(error?.response?.data?.error || error?.message || 'Failed to fetch history.')
		} finally {
			setIsHistoryLoading(false)
		}
	}, [authToken])

	useEffect(() => {
		refreshHistory()
	}, [refreshHistory])

	return {
		historyItems,
		isHistoryLoading,
		historyError,
		refreshHistory,
	}
}
