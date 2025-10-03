import { API_PATHS } from "@/lib/paths";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type Project = {
    id: string;
    name: string;
    githubUrl: string;
};
export const useGetProjects = () => {
    return useQuery<Project[]>({
        queryKey: ["projects"],
        queryFn: async () => {
            const res = await fetch(API_PATHS.GETPROJECTS);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || "Failed to fetch projects");
            }
            return res.json();
        },
    });
}


export const useGetProjectById = (id?: string) => {
    return useQuery<Project>({
        queryKey: ["project", id], 
        queryFn: async () => {
            if (!id) throw new Error("Project ID is required");

            const res = await fetch(API_PATHS.GET_PROJECTS_BY_ID(id));
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || "Failed to fetch project");
            }
            return res.json();
        },
        enabled: !!id, 
    });
};

export const useTeamMembers = (projectId: string) => {
    return useQuery({
        queryKey: ["team-members", projectId],
        queryFn: async () => {
            const res = await fetch(`/api/projects/${projectId}/team`);
            if (!res.ok) throw new Error("Failed to fetch team members");
            return res.json();
        },
        enabled: !!projectId,
    });
};

export const useDeleteProject = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (projectId: string) => {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete project");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        },
    });
};
