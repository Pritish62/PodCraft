import { useCallback, useEffect, useState } from 'react'
import { fetchUserProjects } from '../api/projectsApi'

export function useProjects(authToken) {
	const [projects, setProjects] = useState([])
	const [isProjectsLoading, setIsProjectsLoading] = useState(false)
	const [projectsError, setProjectsError] = useState('')

	const refreshProjects = useCallback(async () => {
		if (!authToken) {
			setProjects([])
			setProjectsError('')
			return
		}

		setIsProjectsLoading(true)
		setProjectsError('')

		try {
			const items = await fetchUserProjects(authToken)
			setProjects(items)
		} catch (error) {
			setProjectsError(error?.response?.data?.error || error?.message || 'Failed to fetch projects.')
		} finally {
			setIsProjectsLoading(false)
		}
	}, [authToken])

	const upsertProject = useCallback((project) => {
		if (!project?.id) {
			return
		}

		setProjects((previousProjects) => {
			const remainingProjects = previousProjects.filter((item) => item.id !== project.id)
			return [project, ...remainingProjects]
		})
	}, [])

	useEffect(() => {
		refreshProjects()
	}, [refreshProjects])

	return {
		projects,
		isProjectsLoading,
		projectsError,
		refreshProjects,
		upsertProject,
	}
}
