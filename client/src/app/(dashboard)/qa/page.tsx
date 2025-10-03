"use client"
import React, { Fragment, useState } from 'react'
import MarkdownPreview from '@uiw/react-markdown-preview';
import { useTheme } from 'next-themes';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import AskQuestionCard from '@/components/dashboard/AskQuestion';
import { useProject } from '@/components/ProjectProvider';
import CodeRefrence from '@/components/dashboard/code-refrence';
import { useGetAnswers } from '@/hooks/use-save-answer';

const QAPage = () => {
    const { projectId } = useProject();
    const { data: questions } = useGetAnswers( projectId );
    const { theme } = useTheme()
    const [questionIndex, setQuestionIndex] = useState(0);
    const question = questions?.[questionIndex];

    return (
        <Sheet>
            <AskQuestionCard />
            <div className='h-4'></div>
            <h1 className='text-xl font-semibold'>Saved Question</h1>
            <div className="h-2"></div>
            <div className="flex flex-col gap-2">
                {questions?.map((question, index) => {
                    return <Fragment key={question.id}>
                        <SheetTrigger onClick={() => setQuestionIndex(index)}>
                            <div className='flex items-center gap-4  rounded-lg p-4 shadow border'>
                                <img className='rounded-full' height={30} width={30} src={question.user.imageUrl ?? ""} />
                                <div className='text-left flex flex-col'>
                                    <div className='flex items-center justify-between '>
                                        <p className=' line-clamp-1 text-lg font-medium'>
                                            {question.question}
                                        </p>
                                        <span className='text-sm text-gray-400 whitespace-nowrap '>
                                            {new Date(question.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className='text-gray-500 line-clamp-1 text-sm'>
                                        {question.answer}
                                    </p>
                                </div>
                            </div>
                        </SheetTrigger>
                    </Fragment>
                })}
            </div>


            {question && (
                <SheetContent className='sm:max-w-[80vw]'>
                    <SheetHeader>
                        <SheetTitle>
                            {question.question}
                        </SheetTitle>
                        <MarkdownPreview source={question.answer}
                            style={{ padding: '1rem', background: 'transparent' }}
                            wrapperElement={{
                                "data-color-mode": theme === 'dark' ? 'dark' : 'light',
                            }} />
                        <div className="h-4"></div>
                        <CodeRefrence filesRefrences={(question.filesRefrences ?? []) as any} />
                    </SheetHeader>
                </SheetContent>
            )}
        </Sheet>
    )
}

export default QAPage