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
import { Sparkles, Loader2, ArrowRight } from 'lucide-react'

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
                <DialogContent className="glass sm:max-w-[73vw] border-white/5 rounded-[30px] shadow-2xl overflow-hidden p-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
                    <DialogHeader className="p-8 pb-4 border-b border-white/5 relative z-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-primary/10 rounded-xl">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                </div>
                                <DialogTitle className="text-2xl font-black text-gradient">AskGit Analysis</DialogTitle>
                            </div>

                            <Button
                                className="rounded-xl font-bold bg-primary text-primary-foreground hover:shadow-[0_0_20px_oklch(var(--primary)/0.3)] transition-all"
                                disabled={saveAnswer.isPending}
                                onClick={() => {
                                    if (!userId || !projectId) {
                                        toast.error(!userId ? "User ID missing" : "Project ID missing")
                                        return
                                    }

                                    saveAnswer.mutate(
                                        {
                                            projectId: projectId as string,
                                            question,
                                            answer,
                                            filesRefrences: filesReferences,
                                            userId,
                                        },
                                        {
                                            onSuccess: () => {
                                                toast.success('Answer saved to your knowledge base')
                                                refetch();
                                            },
                                            onError: () => {
                                                toast.error("Failed to save answer");
                                            },
                                        }
                                    )
                                }}
                            >
                                {saveAnswer.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : "Save Insight"}
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="p-8 space-y-8 relative z-10 overflow-y-auto max-h-[70vh] no-scrollbar">
                        <MarkdownPreview
                            source={answer}
                            className='rounded-2xl border border-white/5 bg-black/20 p-6'
                            style={{ background: 'transparent' }}
                            wrapperElement={{
                                "data-color-mode": theme.theme === 'dark' ? 'dark' : 'light',
                            }}
                        />

                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 opacity-50">References Found</h3>
                            <CodeRefrence filesRefrences={filesReferences} />
                        </div>
                    </div>

                    <div className="p-4 bg-white/5 backdrop-blur-md border-t border-white/5 flex justify-center">
                        <Button
                            variant="ghost"
                            onClick={() => { setOpen(false) }}
                            className="font-bold text-muted-foreground hover:text-foreground"
                        >
                            Dismiss
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Card className='glass relative col-span-3 border-white/5 overflow-hidden group'>
                <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity">
                    <Sparkles className="h-20 w-20 text-primary rotate-12" />
                </div>
                <CardHeader className="relative z-10">
                    <CardTitle className="text-2xl font-black">Ask a question</CardTitle>
                    <p className="text-sm text-muted-foreground">Deep dive into your codebase with AI.</p>
                </CardHeader>
                <CardContent className="relative z-10">
                    <form onSubmit={onSubmit} className="space-y-6">
                        <Textarea
                            className='min-h-[120px] glass-dark border-white/5 rounded-2xl focus-visible:ring-primary/30 transition-all resize-none p-6 text-lg placeholder:opacity-30'
                            placeholder='e.g., Which file should I edit to change the home page?'
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                        />
                        <Button 
                            type='submit' 
                            disabled={loading || !question.trim()}
                            className="w-full sm:w-auto px-10 py-6 rounded-2xl font-bold bg-primary text-primary-foreground hover:shadow-[0_0_30px_oklch(var(--primary)/0.4)] transition-all hover:scale-[1.02] active:scale-95 text-lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                    Synthesizing...
                                </>
                            ) : (
                                <>
                                    Ask askGit
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </>
    )
}

export default AskQuestionCard
