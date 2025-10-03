'use client'
import { Navbar } from "@/components/dashboard/Navbar"
import { SidebarComp } from "@/components/dashboard/Sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-muted/40">
            <SidebarComp />

            <div className="flex flex-1 flex-col">
                <Navbar />

                {/* Main content area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {/* The child content is rendered here. 
                      The old inner div with hardcoded height is no longer needed.
                    */}
                    {children}
                </main>
            </div>
        </div>
    )
}
