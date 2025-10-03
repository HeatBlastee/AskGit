// app/providers/LoadingProvider.tsx
"use client";

import { createContext, useContext, useState } from "react";
import { Spinner } from "./Spinner";

type LoadingContextType = {
    isLoading: boolean;
    setLoading: (loading: boolean) => void;
};

const LoadingContext = createContext<LoadingContextType | null>(null);

export const LoadingProvider = ({ children }: { children: React.ReactNode }) => {
    const [isLoading, setLoading] = useState(false);

    return (
        <LoadingContext.Provider value={{ isLoading, setLoading }}>
            {children}
            {isLoading && (
                <Spinner/>
            )}
        </LoadingContext.Provider>
    );
};

export const useGlobalLoading = () => {
    const ctx = useContext(LoadingContext);
    if (!ctx) throw new Error("useGlobalLoading must be used inside LoadingProvider");
    return ctx;
};
