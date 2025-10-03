"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_PATHS } from "@/lib/paths";

export type AuthUser = {
    id: string;
    email: string;
    name: string | null;
};

type AuthContextType = {
    user: AuthUser | null;
    isLoading: boolean;
    refetch: () => void;
    isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchMe(): Promise<{ user: AuthUser | null }> {
    const res = await fetch(API_PATHS.ME, { credentials: "include" });
    if (!res.ok) {
        return { user: null };
    }
    return res.json();
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ["authUser"],
        queryFn: fetchMe,
        retry: false,
        refetchOnWindowFocus: false,
    });

    const user = data?.user ?? null;

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                refetch,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};
