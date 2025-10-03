
import React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useProject } from '../ProjectProvider'
import useRefetch from '@/hooks/use-refetch'
import { useDeleteProject } from '@/hooks/use-get-projects'

const DeleteButton = () => {
    // const deleteProject = api.project.deleteProject.useMutation()
    const deleteProject = useDeleteProject()
    const { projectId } = useProject()
    const refetch = useRefetch();
    return (
        <>
            <Button disabled={deleteProject.isPending} size={'sm'} variant={'destructive'} onClick={() => {
                const confirm = window.confirm("Are you sure you want to delete this project?")
                if (confirm) deleteProject.mutate(projectId as string, {
                    onSuccess: () => {
                        toast.success("Project deleted successfully")
                        refetch()
                    },
                    onError: () => {
                        toast.error("Failed to delete project")
                    }
                })
            }}>
                Delete
            </Button>
        </>
    )
}

export default DeleteButton