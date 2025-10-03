"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// -------- GET ALL MEETINGS FOR PROJECT --------
export const useMeetings = (projectId: string) => {
    return useQuery({
        queryKey: ["meetings", projectId],
        queryFn: async () => {
            const res = await fetch(`/api/meetings?projectId=${projectId}`);
            if (!res.ok) throw new Error("Failed to fetch meetings");
            return res.json();
        },
        enabled: !!projectId,
        refetchOnWindowFocus: false
    });
};

// -------- GET SINGLE MEETING --------
export const useMeeting = (meetingId: string) => {
    return useQuery({
        queryKey: ["meeting", meetingId],
        queryFn: async () => {
            const res = await fetch(`/api/meetings/${meetingId}`);
            if (!res.ok) throw new Error("Failed to fetch meeting");
            return res.json();
        },
        enabled: !!meetingId,
        refetchInterval: 4000,
        refetchOnWindowFocus: false
    });
};

// -------- CREATE MEETING --------
export const useCreateMeeting = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { projectId: string; meetingUrl: string; name: string }) => {
            const res = await fetch("/api/meetings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to create meeting");
            return res.json();
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["meetings", variables.projectId] });
        },
    });
};

// -------- DELETE MEETING --------
export const useDeleteMeeting = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ meetingId, projectId }: { meetingId: string; projectId: string }) => {
            const res = await fetch(`/api/meetings/${meetingId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete meeting");
            return res.json();
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["meetings", variables.projectId] });
        },
    });
};
