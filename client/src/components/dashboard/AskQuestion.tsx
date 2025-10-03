"use client"
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Textarea } from '../ui/textarea'
import { useTheme } from 'next-themes'
import { askQuestion } from './action'
import useRefetch from '@/hooks/use-refetch'
import MarkdownPreview from '@uiw/react-markdown-preview';
import CodeRefrence from './code-refrence'
import { useSaveAnswer } from '@/hooks/use-save-answer'
import { useProject } from '../ProjectProvider'
import { useAuth } from '../AuthProvider'

const AskQuestionCard = () => {
    const { projectId } = useProject();
    const { user } = useAuth();
    const userId = user?.id;
    const theme = useTheme();
    const [question, setQuestion] = useState('')
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [filesReferences, setFilesReferences] = useState<{ fileName: string, sourceCode: string, summary: string }[]>([])
    const [answer, setAnswer] = useState('')

    const saveAnswer = useSaveAnswer(); // ✅ hook instance
    const refetch = useRefetch();

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setAnswer('')
        setFilesReferences([])

        if (!projectId) return
        setLoading(true)

        try {
            const { output, filesRefrences } = await askQuestion(question, projectId)
            setOpen(true)
            setFilesReferences(filesRefrences)
            setAnswer(output);
        } catch (err) {
            toast.error("Failed to fetch answer")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[73vw]">
                    <DialogHeader>
                        <div className="flex items-center gap-2 ">
                            <DialogTitle>
                                <div className='flex items-center gap-2'>
                                    <h1 className='text-2xl font-bold'>AskGit</h1>
                                </div>
                            </DialogTitle>

                            <Button
                                variant={'outline'}
                                disabled={saveAnswer.isPending}
                                onClick={() => {
                                    if (!userId) {
                                        toast.error("User ID missing")
                                        return
                                    }

                                    saveAnswer.mutate(
                                        {
                                            projectId,
                                            question,
                                            answer,
                                            filesRefrences: filesReferences,
                                            userId,
                                        },
                                        {
                                            onSuccess: () => {
                                                toast.success('Answer saved successfully')
                                                refetch();
                                            },
                                            onError: () => {
                                                toast.error("Failed to save answer");
                                            },
                                        }
                                    )
                                }}
                            >
                                {saveAnswer.isPending ? "Saving..." : "Save Answer"}
                            </Button>
                        </div>
                    </DialogHeader>

                    <MarkdownPreview
                        source={answer}
                        className='max-w-[70vw] h-full max-h-[30vh] overflow-scroll -mt-2'
                        style={{ padding: '1rem', background: 'transparent' }}
                        wrapperElement={{
                            "data-color-mode": theme.theme === 'dark' ? 'dark' : 'light',
                        }}
                    />

                    <CodeRefrence filesRefrences={filesReferences} />

                    <button
                        type='button'
                        onClick={() => { setOpen(false) }}
                        className='border rounded-md py-2 -mt-3 bg-primary/40'
                    >
                        Close
                    </button>
                </DialogContent>
            </Dialog>

            <Card className='relative col-span-3'>
                <CardHeader>
                    <CardTitle>Ask a question</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit}>
                        <Textarea
                            className='h-28'
                            placeholder='Which file should I edit to change the home page?'
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                        />
                        <div className="h-4"></div>
                        <Button type='submit' disabled={loading}>
                            {loading ? 'Asking askGit...' : 'Ask askGit!'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </>
    )
}

export default AskQuestionCard
