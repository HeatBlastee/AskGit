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
import { cn } from "@/lib/utils";
import { Activity, Sparkles } from "lucide-react";

const MeetingCard = () => {
    const { projects, projectId, setProjectId } = useProject();
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
            if (!projectId) {
                toast.error("Please select a project first");
                return;
            }
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
                const result = await uploadFile(file as File, setProgress);
                
                if (!result.success || !result.url) {
                    throw new Error(typeof result.error === 'string' ? result.error : "Upload failed");
                }

                const url = result.url;

                uploadMeeting.mutate({
                    projectId: projectId,
                    meetingUrl: url,
                    name: file.name,
                }, {
                    onSuccess: (meeting) => {
                        toast.success("Meeting uploaded successfully")
                        router.push('/meetings')
                        processMeeting.mutateAsync({
                            meetingUrl: url,
                            meetingId: meeting.id,
                            projectId: projectId
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
        <Card 
            className={cn(
                'glass relative group flex flex-col items-center justify-center p-10 h-full border-white/5 transition-all duration-500 ease-out cursor-pointer hover:bg-white/10 group-hover:-translate-y-2',
                isUploading && "cursor-wait"
            )} 
            {...getRootProps()}
        >
            {!isUploading && (
                <>
                    <div className="p-4 bg-primary/10 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-500">
                        <Presentation className='h-10 w-10 text-primary group-hover:rotate-12 transition-transform duration-500' />
                    </div>
                    <h3 className='text-2xl font-bold text-center mb-2'>Analyze Meeting</h3>
                    <p className='text-muted-foreground text-center text-sm leading-relaxed max-w-[200px] mb-6'>
                        Upload your meeting audio for AI-powered summarization.
                    </p>
                    <Button disabled={isUploading} className="rounded-xl px-6 font-bold shadow-lg shadow-primary/20">
                        <Upload className='h-4 w-4 mr-2' />
                        Upload Audio
                        <input className='hidden' {...getInputProps()} />
                    </Button>
                </>
            )}

            {isUploading && (
                <div className="flex flex-col items-center justify-center w-full space-y-6">
                    <CircularProgress progress={progress} />
                    <div className="space-y-2 text-center">
                        <p className="text-sm font-bold text-primary animate-pulse">
                            Processing Audio...
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-50">
                            Uploading to secure vault
                        </p>
                    </div>
                </div>
            )}
        </Card>
    )
}

export default MeetingCard
