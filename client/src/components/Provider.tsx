"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/sonner"
import { useState } from "react"
import { ProjectProvider } from "./ProjectProvider"
import { AuthProvider } from "./AuthProvider"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export default function Providers({ children }: { children: React.ReactNode }) {
    // ensure one QueryClient per app, not per render
    const [queryClient] = useState(() => new QueryClient())

    return (
        <QueryClientProvider client={queryClient}>
            <NextThemesProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
            >
                <AuthProvider>
                    <ProjectProvider>
                        {children}
                    </ProjectProvider>
                </AuthProvider>
            </NextThemesProvider>
            <Toaster />
        </QueryClientProvider>
    )
}
