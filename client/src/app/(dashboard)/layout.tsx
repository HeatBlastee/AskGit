'use client'
import { useAuth } from "@/components/AuthProvider";
import  { Navbar }  from "@/components/dashboard/Navbar"
import { SidebarComp } from "@/components/dashboard/Sidebar"
import { useProject } from "@/components/ProjectProvider";
import { Spinner } from "@/components/Spinner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const { projects, setProjectId, isLoading: isProjectLoader } = useProject();

    if (isLoading || isProjectLoader) {
        return <Spinner/>
    }
    
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-muted/40">
            <SidebarComp projects={projects} isLoading={isLoading} setProjectId={setProjectId}/>

            <div className="flex flex-1 flex-col">
                <Navbar user={user} />

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
