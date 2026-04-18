"use client"
import MeetingCard from '@/components/dashboard/MeetingCard'
import { useProject } from '@/components/ProjectProvider'
import { Button } from '@/components/ui/button'
import { useDeleteMeeting, useMeetings } from '@/hooks/use-meetings'
import useRefetch from '@/hooks/use-refetch'
import { Badge, Clock, Users, Trash2, Presentation, Activity } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { toast } from 'sonner'

const MeetingPage = () => {
    const { projectId } = useProject()
    const { data: meetings, isLoading } = useMeetings(projectId as string)
    const deleteMeeting = useDeleteMeeting();
    const refetch = useRefetch()

    return (
        <div className="flex flex-col gap-10 p-6 md:p-12 max-w-5xl mx-auto">
            <MeetingCard />
            
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Users className="h-5 w-5 text-primary" />
                    </div>
                    <h1 className='text-2xl font-black text-gradient'>Meeting Records</h1>
                </div>

                <div className="grid gap-4">
                    {isLoading && (
                        <div className="space-y-4">
                            {[1, 2].map(i => <div key={i} className="h-24 glass animate-pulse rounded-[24px]" />)}
                        </div>
                    )}

                    {!isLoading && (!meetings || meetings.length === 0) && (
                        <div className="glass rounded-3xl p-12 text-center border-white/5">
                            <p className="text-muted-foreground font-medium">No meeting records found. Upload your first meeting to begin analysis.</p>
                        </div>
                    )}

                    {meetings?.map((meeting: any) => (
                        <div key={meeting.id} className='group glass relative rounded-[24px] p-6 border-white/5 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1'>
                            <div className="flex items-center justify-between gap-6">
                                <div className="flex items-center gap-6 flex-1 min-w-0">
                                    <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-primary/10 transition-colors duration-500">
                                        <Presentation className="h-6 w-6 text-primary/60 group-hover:text-primary transition-colors duration-500" />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className='flex items-center gap-3 mb-1'>
                                            <Link href={`/meetings/${meeting.id}`} className='text-lg font-bold hover:text-primary transition-colors truncate'>
                                                {meeting.name}
                                            </Link>
                                            {meeting.status === 'PROCESSING' && (
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[9px] font-black text-yellow-600 uppercase tracking-widest animate-pulse">
                                                    <Clock className="h-3 w-3" />
                                                    Processing
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className='flex items-center text-[10px] font-bold text-muted-foreground gap-x-4 uppercase tracking-widest opacity-60'>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(meeting.createdAt).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Activity className="h-3 w-3" />
                                                {meeting.issues.length} Issues Detected
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className='flex items-center gap-3'>
                                    <Link href={`/meetings/${meeting.id}`}>
                                        <Button variant='secondary' className="rounded-xl font-bold px-6">
                                            View
                                        </Button>
                                    </Link>
                                    <Button 
                                        size='icon' 
                                        disabled={deleteMeeting.isPending} 
                                        variant='ghost' 
                                        className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
                                        onClick={() => {
                                            if (!projectId) return;
                                            deleteMeeting.mutate({ meetingId: meeting.id, projectId }, {
                                                onSuccess: () => {
                                                    toast.success('Meeting deleted successfully')
                                                    refetch()
                                                },
                                                onError: () => {
                                                    toast.error('Failed to delete meeting')
                                                }
                                            })
                                        }} 
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default MeetingPage