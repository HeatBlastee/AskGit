
"use client";

import { API_PATHS } from "@/lib/paths";
import { useQuery } from "@tanstack/react-query";

export type User = {
    id: string;
    name: string;
    email: string;
    imageUrl?: string;
    user?: User;
};

async function fetchUser(): Promise<User> {
    const res = await fetch(API_PATHS.ME);
    if (!res.ok) throw new Error("Not authenticated");
    return res.json();
}

export function useAuth() {
        const { data: user, error, isLoading, isFetching, refetch } = useQuery<User>({
            queryKey: ["authUser"],
            queryFn: fetchUser,
            retry: false,
            staleTime: 1000 * 60 * 10,
            refetchOnWindowFocus: false,
        });

        return {
            user,
            loading: isLoading || isFetching,
            isAuthenticated: !!user,
            error,
            refetch,
        };
    }

