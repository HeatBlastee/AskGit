"use client"

import React from 'react'
import { useProject } from '../ProjectProvider'
import { useTeamMembers } from '@/hooks/use-get-projects'

const TeamMembers = () => {
    const { projectId } = useProject()
    const { data: members } = useTeamMembers(projectId as string);
    return (
        <div className='flex items-center gap-2'>
            {members?.map(member => (
                <img key={member.id} src={member.user.imageUrl ?? ""} alt={member.user.firstName ?? ''} height={30} width={30} className='rounded-full' />
            ))}
        </div>
    )
}

export default TeamMembers