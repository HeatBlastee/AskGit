"use client";

import Link from "next/link";
import { useProject } from "../ProjectProvider";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Icons
import { PlusCircle, FolderKanban, Loader2, ArrowRight, Activity, Sparkles } from "lucide-react";

// Custom Components
import MeetingCard from "./MeetingCard";
import { cn } from "@/lib/utils";

const Dashboard = () => {
    // Fetches project data using the provided hook
    const { projects, isLoading, setProjectId } = useProject();

    return (
        <div className="flex flex-col gap-10 p-6 md:p-12 lg:p-16 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-gradient">
                    Welcome Back<span className="text-primary">.</span>
                </h1>
                <p className="text-muted-foreground text-lg">
                    Monitor your repositories and gain deep insights with askGit.
                </p>
            </div>

            {/* ## Get Started Section */}
            <section className="space-y-8">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold tracking-tight uppercase tracking-[0.2em] opacity-70">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                    {/* ### Card for creating a new project */}
                    <Link
                        href="/create"
                        className="group relative"
                    >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                        <Card className="glass relative flex flex-col items-center justify-center p-10 h-full border-white/5 transition-all duration-500 ease-out group-hover:bg-white/10 group-hover:-translate-y-2">
                            <div className="p-4 bg-primary/10 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-500">
                                <PlusCircle className="h-10 w-10 text-primary group-hover:rotate-90 transition-transform duration-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-center mb-2">
                                Start Analysis
                            </h3>
                            <p className="text-muted-foreground text-center text-sm leading-relaxed max-w-[200px]">
                                Connect a new Git repository and let our AI analyze it.
                            </p>
                            <div className="mt-6 flex items-center gap-2 text-primary font-bold text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                Get Started <ArrowRight className="h-4 w-4" />
                            </div>
                        </Card>
                    </Link>

                    {/* ### Card for creating a new meeting */}
                    <div className="group relative">
                        <MeetingCard />
                    </div>
                </div>
            </section>

            {/* ## Existing Projects Section */}
            <section className="space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-bold tracking-tight uppercase tracking-[0.2em] opacity-70">Recent Projects</h2>
                    </div>
                    {projects && projects.length > 0 && (
                        <div className="text-xs font-bold text-muted-foreground bg-white/5 px-3 py-1 rounded-full border border-white/5">
                            {projects.length} Total Projects
                        </div>
                    )}
                </div>

                {/* ### Loading state for projects */}
                {isLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 glass animate-pulse rounded-3xl" />
                        ))}
                    </div>
                )}

                {/* ### Renders projects if they exist */}
                {!isLoading && projects && projects.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {projects.map((project) => (
                            <Link
                                key={project.id}
                                href={`/project/${project.id}`}
                                onClick={() => setProjectId(project.id)}
                                className="group relative"
                            >
                                <Card className="glass h-full flex flex-col justify-between border-white/5 transition-all duration-500 ease-out group-hover:bg-white/10 group-hover:-translate-y-2 group-hover:border-primary/20">
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-3 bg-white/5 rounded-xl group-hover:bg-primary/10 transition-colors duration-500">
                                                <FolderKanban className="h-6 w-6 text-primary/70 group-hover:text-primary transition-colors duration-500" />
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-bold text-green-500 uppercase tracking-wider scale-90">
                                                <span className="relative flex h-2 w-2">
                                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                </span>
                                                Active
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold truncate group-hover:text-primary transition-colors duration-300" title={project.name}>
                                            {project.name}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-2 line-clamp-1 opacity-60">
                                            {project.githubUrl}
                                        </p>
                                    </div>
                                    <div className="px-6 py-4 mt-auto border-t border-white/5 flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                                        <span>View Analysis</span>
                                        <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}

                {/* ### Empty state when no projects are found */}
                {!isLoading && (!projects || projects.length === 0) && (
                    <div className="text-center py-24 glass rounded-[40px] border-white/5 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="relative z-10">
                            <div className="mx-auto h-20 w-20 bg-white/5 rounded-[30px] flex items-center justify-center mb-8 rotate-3 group-hover:rotate-12 transition-transform duration-500">
                                <FolderKanban className="h-10 w-10 text-muted-foreground/30 group-hover:text-primary/40 transition-colors duration-500" />
                            </div>
                            <h3 className="text-3xl font-black mb-3 text-gradient">Deep Void Detected</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto text-lg leading-relaxed">
                                No projects found in our logic engines. Connect your first repository to begin.
                            </p>
                            <Link href="/create" className="mt-10 inline-flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold hover:shadow-[0_0_30px_oklch(var(--primary)/0.4)] transition-all duration-300 hover:scale-105 active:scale-95">
                                Initialize First Project
                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};

export default Dashboard;