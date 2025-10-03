"use client";

import { createContext, useContext } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { Spinner } from "./Spinner";

type LoadingContextType = {};

const LoadingContext = createContext<LoadingContextType>({});

export const LoadingProvider = ({ children }: { children: React.ReactNode }) => {
    const isFetching = useIsFetching(); // number of active queries
    const isMutating = useIsMutating(); // number of active mutations
    const isLoading = isFetching + isMutating > 0;

    return (
        <LoadingContext.Provider value={{}}>
            {children}

            {/* Fullscreen Loader Overlay */}
            {isLoading && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    
                        <Spinner/>
                </div>
            )}
        </LoadingContext.Provider>
    );
};

export const useGlobalLoading = () => useContext(LoadingContext);
