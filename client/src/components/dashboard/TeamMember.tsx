"use client";

import React from "react";
import { useProject } from "../ProjectProvider";
import { useTeamMembers } from "@/hooks/use-get-projects";

const TeamMembers = () => {
    const { projectId } = useProject();

    // useTeamMembers should be a React Query hook
    const { data: members, isLoading } = useTeamMembers(projectId as string);

    // Optional: you can show a small local spinner while the global loader covers everything
    if (isLoading) {
        return (
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            {members?.map((member) => (
                <img
                    key={member.id}
                    src={member.user.imageUrl ?? ""}
                    alt={member.user.firstName ?? ""}
                    height={30}
                    width={30}
                    className="rounded-full"
                />
            ))}
        </div>
    );
};

export default TeamMembers;
