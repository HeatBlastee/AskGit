"use client";

import { useQuery } from "@tanstack/react-query";

export const useCommits = (projectId: string) => {
    return useQuery({
        queryKey: ["commits", projectId],
        queryFn: async () => {
            const res = await fetch(`/api/projects/${projectId}/commits`);
            if (!res.ok) throw new Error("Failed to fetch commits");
            return res.json();
        },
        enabled: !!projectId,
        refetchOnWindowFocus: false
    });
    
};
