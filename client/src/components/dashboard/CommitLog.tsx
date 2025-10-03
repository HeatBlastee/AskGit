"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useCommits } from "@/hooks/use-commits";
import { cn } from "@/lib/utils";

interface CommitLogProps {
    projectId: string;
    githubUrl: string;
}

const CommitLog = ({ projectId, githubUrl }: CommitLogProps) => {
    const { data: commits, isLoading, error } = useCommits(projectId);

    if (!githubUrl) return <div className="text-xs text-gray-500">No project selected.</div>;
    if (isLoading) return <div className="text-xs text-gray-500">Loading commits...</div>;
    if (error) return <div className="text-xs text-red-500">Error loading commits: {(error as Error).message}</div>;
    if (!commits?.length) return <div className="text-xs text-gray-500">No commits found.</div>;

    return (
        <>
            <p className="text-xs text-gray-500 pb-1 font-medium">Latest commits</p>
            <ul className="space-y-4">
                {commits
                    .sort((a: any, b: any) => new Date(b.commitDate).getTime() - new Date(a.commitDate).getTime())
                    .map((commit: any, idx: number) => (
                        <li key={commit.id} className="relative flex gap-x-3">
                            {/* Vertical line */}
                            <div className={cn(idx === commits.length - 1 ? "h-4" : "-bottom-4", "absolute left-0 top-0 flex w-5 justify-center")}>
                                <div className="w-px translate-x-1 bg-gray-200"></div>
                            </div>

                            {/* Avatar */}
                            <img
                                src={commit.commitAuthorAvatar}
                                alt="commit avatar"
                                className="relative mt-2 w-6 h-6 flex-none rounded-full bg-gray-50"
                            />

                            {/* Commit content */}
                            <div className="flex-auto rounded-md p-2 ring-1 ring-inset ring-border">
                                <div className="flex justify-between gap-x-2">
                                    <Link
                                        href={`${githubUrl}/commit/${commit.commitHash}`}
                                        target="_blank"
                                        className="text-xs text-muted-foreground flex items-center gap-1"
                                    >
                                        <span className="font-medium text-foreground">{commit.commitAuthorName}</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </Link>
                                    <span className="text-[10px] text-muted-foreground">
                                        {new Date(commit.commitDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                                    </span>
                                </div>
                                <p className="text-sm font-semibold text-foreground mt-1">{commit.commitMessage}</p>
                                {commit.summary && (
                                    <p
                                        className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap leading-5"
                                        dangerouslySetInnerHTML={{
                                            __html: commit.summary
                                                .replace(/(\*{2})(.*?)\1/g, "<b>$2</b>")
                                                .replace(/(['"`])(.*?)\1/g, "<b>$2</b>"),
                                        }}
                                    />
                                )}
                            </div>
                        </li>
                    ))}
            </ul>
        </>
    );
};

export default CommitLog;
