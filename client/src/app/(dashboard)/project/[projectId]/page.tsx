"use client"
import AskQuestionCard from '@/components/dashboard/AskQuestion';
import CommitLog from '@/components/dashboard/CommitLog';
import DeleteButton from '@/components/dashboard/DeleteButton';
import InviteButton from '@/components/dashboard/InviteMeeting';
import MeetingCard from '@/components/dashboard/MeetingCard';
import TeamMembers from '@/components/dashboard/TeamMember';
import { Spinner } from '@/components/Spinner';
import { useAuth } from '@/hooks/use-auth';
import { useGetProjectById } from '@/hooks/use-get-projects';
import { ExternalLink, Github } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React from 'react'



const Page = () => {
    const { projectId } = useParams();
    const { data: project, isLoading } = useGetProjectById(projectId as string);
    const { user } = useAuth();
    
    if (isLoading) {
        return <Spinner/>
    }
    
    return (
        <div>
            {/* <h1 className='text-2xl font-bold'>{project?.name}</h1>
      <div className='h-2'></div> */}


            <div className='flex items-center justify-between flex-wrap gap-y-4'>
                {/* Github Link */}
                <div className='w-fit  rounded-md bg-primary px-4 py-3'>
                    <div className='flex items-center'>
                        <Github className='size-5 text-white' />
                        <div className='ml-2'>
                            <p className='text-sm font-medium text-white'>
                                This project is linked to {" "}
                                <Link href={project?.githubUrl ?? ""} target='_blank' className='inline-flex items-center text-white/80 hover:underline'>
                                    {project?.githubUrl}
                                    <ExternalLink className='size-4 ml-1' />
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                <div className='h-4'></div>

                <div className='flex items-center gap-4 '>
                    <TeamMembers />
                    <InviteButton projectId={ projectId as string} />
                    <DeleteButton />
                </div>

            </div>


            <div className='mt-4'>

                <div className='grid grid-cols-1 gap-4 sm:grid-cols-5'>
                    <AskQuestionCard  />
                    <MeetingCard />
                </div>
            </div>

            <div className='mt-8'></div>

            <CommitLog projectId={projectId as string} githubUrl={project?.githubUrl as string} />

        </div>

            )
}

 export default Page