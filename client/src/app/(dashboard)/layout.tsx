"use client"
import { useAuth } from "@/components/AuthProvider";
import Navbar from "@/components/dashboard/Navbar"
import { SidebarComp } from "@/components/dashboard/Sidebar"
import { useProject } from "@/components/ProjectProvider";
import { Spinner } from "@/components/Spinner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { projects, setProjectId, isLoading: isProjectLoading } = useProject();

    if (isAuthLoading || isProjectLoading || !user) {
        return <Spinner/>
    }
    
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-muted/40 font-sans">
            <SidebarComp projects={projects} isLoading={isProjectLoading} setProjectId={setProjectId}/>

            <div className="flex flex-1 flex-col">
                <Navbar user={{
                    ...user,
                    name: user.name ?? ""
                }} />

                {/* Main content area */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
