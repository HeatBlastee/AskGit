// hooks/use-create-project.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_PATHS } from "@/lib/paths";

export type CreateProjectInput = {
    name: string;
    githubUrl: string;
    githubToken?: string;
};

export const useCreateForm = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateProjectInput) => {
            const res = await fetch(API_PATHS.CREATE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to create project");
            }

            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        },
        
    });
};

