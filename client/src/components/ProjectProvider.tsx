"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocalStorage } from "usehooks-ts";
import { API_PATHS } from "@/lib/paths";

export type Project = {
    id: string;
    name: string;
    githubUrl: string;
};

type ProjectContextType = {
    projects?: Project[];
    project?: Project;
    projectId: string | null;
    setProjectId: (id: string) => void;
    isLoading: boolean;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

async function fetchProjects(): Promise<Project[]> {

    const res = await fetch(API_PATHS.GETPROJECTS);
    if (!res.ok) throw new Error("Failed to fetch projects");
    return res.json();
}

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
    const [projectId, setProjectId] = useLocalStorage<string | null>(
        "dionysus-project-id",
        null
    );

    const { data: projects, isLoading } = useQuery<Project[]>({
        queryKey: ["projects"],
        queryFn: fetchProjects,
    });

    const project = projects?.find((p) => p.id === projectId) ?? null;

    return (
        <ProjectContext.Provider
            value={{
                projects,
                project,
                projectId,
                setProjectId,
                isLoading,
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error("useProject must be used within a ProjectProvider");
    }
    return context;
};
