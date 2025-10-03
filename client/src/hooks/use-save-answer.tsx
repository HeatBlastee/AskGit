// hooks/useSaveAnswer.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type FileReference = {
    fileName: string;
    sourceCode: string;
    summary: string;
};

type SaveAnswerPayload = {
    question: string;
    answer: string;
    filesRefrences?: FileReference[];
    userId: string;
    projectId: string;
};

export function useSaveAnswer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: SaveAnswerPayload) => {
            const res = await fetch("/api/questions/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to save answer");
            }

            return res.json();
        },
        onSuccess: (_, variables) => {
            // 🔄 Invalidate cache for this specific project
            queryClient.invalidateQueries({
                queryKey: ["questions", variables.projectId],
            });
        },
    });
}

// -------------------------------
// ✅ New: Get answers by projectId
// -------------------------------
export function useGetAnswers(projectId: string) {
    return useQuery({
        queryKey: ["questions", projectId],
        queryFn: async () => {
            if (!projectId) return [];
            const res = await fetch(`/api/questions/${projectId}`);
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to fetch answers");
            }
            return res.json();
        },
        enabled: !!projectId, // Only run if projectId is provided
        refetchOnWindowFocus: false
    });
}
