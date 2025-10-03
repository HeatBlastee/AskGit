"use client"
import React, { useState } from 'react'
import { Card } from '@/components/ui/card';
import { useDropzone } from 'react-dropzone';
import { uploadFile } from '@/lib/supabase';
import { Loader2, Presentation, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useProject } from '../ProjectProvider';
import { useCreateMeeting } from '@/hooks/use-meetings';
import { Progress } from '@/components/ui/progress'; 
import { CircularProgress } from '../CircularProgress';

const MeetingCard = () => {
    const project = useProject()
    const router = useRouter();

    const processMeeting = useMutation({
        mutationFn: async (data: { meetingUrl: string, meetingId: string, projectId: string }) => {
            const { meetingUrl, meetingId, projectId } = data;
            const response = await axios.post('/api/process-meeting', {
                meetingUrl,
                meetingId,
                projectId
            })
            return response.data
        }
    })

    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const uploadMeeting = useCreateMeeting();

    const { getInputProps, getRootProps } = useDropzone({
        accept: { 'audio/*': [] },
        multiple: false,
        onDrop: async (acceptedFiles) => {
            setIsUploading(true)
            setProgress(0)

            const file = acceptedFiles[0];
            if (!file) {
                toast.error("Audio files only")
                setIsUploading(false)
                return
            }
            if (file?.size >= 50 * 1024 * 1024) {
                toast.error("File size Limited to 50 MB")
                setIsUploading(false)
                return
            }

            try {
                const url = await uploadFile(file as File, setProgress) as string

                uploadMeeting.mutate({
                    projectId: project.projectId,
                    meetingUrl: url,
                    name: file.name,
                }, {
                    onSuccess: (meeting) => {
                        toast.success("Meeting uploaded successfully")
                        router.push('/meetings')
                        processMeeting.mutateAsync({
                            meetingUrl: url,
                            meetingId: meeting.id,
                            projectId: project.projectId
                        })
                    },
                    onError: () => {
                        toast.error("Failed to upload meeting")
                    }
                })
            } catch (err) {
                toast.error("Upload failed")
                console.error(err)
            } finally {
                setIsUploading(false)
                setProgress(0)
            }
        },
    })

    return (
        <Card className='col-span-2 flex flex-col items-center justify-center p-10' {...getRootProps()}>
            {!isUploading && (
                <>
                    <Presentation className='h-10 w-10 animate-bounce' />
                    <h3 className='mt-2 text-sm font-semibold'>Create a new meeting</h3>
                    <p className='mt-5 text-center text-sm text-gray-500'>
                        Analyse your meeting with askGit.<br />
                    </p>
                    <div className='mt-4'>
                        <Button disabled={isUploading}>
                            <Upload className='h-5 w-5 mr-2' aria-hidden='true' />
                            Upload Meeting
                            <input className='hidden' {...getInputProps()} />
                        </Button>
                    </div>
                </>
            )}

            {isUploading && (
                <div className="flex flex-col items-center justify-center w-full">
                    <CircularProgress progress={progress} />
                    <p className="mt-4 text-gray-500 text-center flex gap-2 items-center">
                        <Loader2 className="animate-spin" />
                        Uploading your meeting...
                    </p>
                </div>
            )}

        </Card>
    )
}

export default MeetingCard
