"use client"
import React, { Fragment, useState } from 'react'
import MarkdownPreview from '@uiw/react-markdown-preview';
import { useTheme } from 'next-themes';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import AskQuestionCard from '@/components/dashboard/AskQuestion';
import { useProject } from '@/components/ProjectProvider';
import CodeRefrence from '@/components/dashboard/code-refrence';
import { useGetAnswers } from '@/hooks/use-save-answer';
import { MessageCircle, Sparkles, ArrowRight } from 'lucide-react';

const QAPage = () => {
    const { projectId } = useProject();
    const { data: questions } = useGetAnswers(projectId);
    const { theme } = useTheme()
    const [questionIndex, setQuestionIndex] = useState(0);
    const question = questions?.[questionIndex];

    return (
        <Sheet>
            <div className="flex flex-col gap-10 p-6 md:p-12 max-w-5xl mx-auto">
                <AskQuestionCard />
                
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <MessageCircle className="h-5 w-5 text-primary" />
                        </div>
                        <h1 className='text-2xl font-black text-gradient'>Knowledge Base</h1>
                    </div>

                    <div className="grid gap-4">
                        {(!questions || questions.length === 0) && (
                            <div className="glass rounded-3xl p-12 text-center border-white/5">
                                <p className="text-muted-foreground font-medium">No saved insights yet. Start by asking a question above.</p>
                            </div>
                        )}
                        
                        {questions?.map((q: any, index: number) => {
                            return <Fragment key={q.id}>
                                <SheetTrigger onClick={() => setQuestionIndex(index)}>
                                    <div className='group relative glass rounded-[24px] p-6 border-white/5 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 text-left'>
                                        <div className="flex items-start gap-6">
                                            <div className="relative">
                                                {q.user.imageUrl ? (
                                                    <img
                                                        className="rounded-full ring-2 ring-primary/20 p-0.5"
                                                        height={45}
                                                        width={45}
                                                        src={q.user.imageUrl}
                                                        alt={q.user.name}
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center rounded-full bg-primary/20 text-primary font-black h-[45px] w-[45px] ring-2 ring-primary/10">
                                                        {q.user.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="absolute -bottom-1 -right-1 bg-background border border-white/10 rounded-full p-1 shadow-xl">
                                                    <Sparkles className="h-3 w-3 text-primary" />
                                                </div>
                                            </div>

                                            <div className='flex-1 min-w-0'>
                                                <div className='flex items-center justify-between mb-1.5'>
                                                    <p className='truncate text-lg font-bold group-hover:text-primary transition-colors'>
                                                        {q.question}
                                                    </p>
                                                    <span className='text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full whitespace-nowrap opacity-60'>
                                                        {new Date(q.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className='text-muted-foreground line-clamp-2 text-sm leading-relaxed opacity-70'>
                                                    {q.answer}
                                                </p>
                                            </div>
                                            
                                            <div className="hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="p-2 bg-primary rounded-xl text-primary-foreground shadow-lg shadow-primary/20">
                                                    <ArrowRight className="h-4 w-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </SheetTrigger>
                            </Fragment>
                        })}
                    </div>
                </div>
            </div>

            {question && (
                <SheetContent className='glass-dark border-white/10 sm:max-w-[80vw] p-0 rounded-l-[40px] overflow-hidden'>
                    <div className="h-full flex flex-col">
                        <div className="p-10 border-b border-white/5 bg-gradient-to-br from-primary/10 via-transparent to-transparent">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]">Insight</div>
                                <span className="text-white/30 text-xs">{new Date(question.createdAt).toLocaleString()}</span>
                            </div>
                            <SheetTitle className="text-3xl font-black text-white tracking-tight">
                                {question.question}
                            </SheetTitle>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-10 no-scrollbar space-y-12">
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-50">AI Synthesis</h3>
                                <MarkdownPreview source={question.answer}
                                    className="rounded-3xl border border-white/5 bg-white/5 p-8"
                                    style={{ background: 'transparent' }}
                                    wrapperElement={{
                                        "data-color-mode": theme === 'dark' ? 'dark' : 'light',
                                    }} />
                            </div>

                            <div className="space-y-4 pb-10">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-50">Code References</h3>
                                <CodeRefrence filesRefrences={(question.filesRefrences ?? []) as any} />
                            </div>
                        </div>
                    </div>
                </SheetContent>
            )}
        </Sheet>
    )
}

export default QAPage