"use client";

import Link from "next/link";
import { useProject } from "../ProjectProvider";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator"; // Add a Separator component for cleaner division

// Icons
import { PlusCircle, FolderKanban, Loader2, ArrowRight } from "lucide-react"; // Added ArrowRight for a subtle call to action

// Custom Components
import MeetingCard from "./MeetingCard";

const Dashboard = () => {
    // Fetches project data using the provided hook
    const { projects, isLoading, setProjectId } = useProject();

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 lg:p-12 max-w-7xl mx-auto">

            {/* ## Get Started Section */}
            <section>
                <h2 className="text-3xl font-bold tracking-tight mb-6 text-gray-900 dark:text-gray-50">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* ### Card for creating a new project */}
                    <Link
                        href="/create"
                        className="h-full block transition-transform duration-300 hover:scale-[1.02]" // Added scale effect
                    >
                        <Card className="group flex flex-col items-center justify-center p-8 sm:p-10 h-full border-2 border-dashed bg-card/50 transition-all duration-300 ease-in-out hover:border-primary/70 hover:shadow-xl shadow-md">
                            <PlusCircle className="h-12 w-12 text-primary transition-transform duration-500 group-hover:rotate-12" />
                            <h3 className="mt-4 text-xl font-bold text-center text-foreground">
                                Start a New Analysis
                            </h3>
                            <p className="mt-2 text-base text-center text-muted-foreground">
                                Analyze a new Git repository and get insights.
                            </p>
                            <ArrowRight className="mt-3 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-primary" />
                        </Card>
                    </Link>

                    {/* ### Card for creating a new meeting (using the provided MeetingCard component) */}
                    {/* Assuming MeetingCard is styled similarly or is a placeholder for a feature */}
                    <MeetingCard />
                </div>
            </section>

            <Separator className="my-6" /> {/* Use the dedicated Separator component */}

            {/* ## Existing Projects Section */}
            <section>
                <h2 className="text-3xl font-bold tracking-tight mb-6 text-gray-900 dark:text-gray-50">Recent Projects</h2>

                {/* ### Loading state for projects */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center p-16 bg-muted/30 rounded-lg shadow-inner">
                        <Loader2 className="h-10 w-10 animate-spin text-primary/70" />
                        <p className="mt-4 text-xl font-medium text-muted-foreground">Fetching your project history...</p>
                    </div>
                )}

                {/* ### Renders projects if they exist */}
                {!isLoading && projects && projects.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {projects.map((project) => (
                            <Link
                                key={project.id}
                                href={`/project/${project.id}`}
                                onClick={() => setProjectId(project.id)}
                                className="block transition-transform duration-200 hover:scale-[1.03]"
                            >
                                <Card className="h-full flex flex-col justify-between hover:shadow-2xl hover:border-primary transition-all duration-300">
                                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                                        <CardTitle className="text-lg font-semibold truncate leading-snug pr-4" title={project.name}>
                                            {project.name}
                                        </CardTitle>
                                        <FolderKanban className="h-6 w-6 text-primary/70 flex-shrink-0" />
                                    </CardHeader>
                                    <CardContent className="pt-2">
                                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                                            <span className="inline-block h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                                            Active Analysis
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}

                {/* ### Empty state when no projects are found */}
                {!isLoading && (!projects || projects.length === 0) && (
                    <div className="text-center py-20 border-2 border-dashed rounded-xl bg-background/50 border-gray-300 dark:border-gray-700">
                        <FolderKanban className="mx-auto h-16 w-16 text-muted-foreground/50" />
                        <h3 className="mt-4 text-2xl font-semibold">No Projects Found Yet</h3>
                        <p className="mt-2 text-base text-muted-foreground">
                            Get started by creating your first project using the **Start a New Analysis** card above.
                        </p>
                        <Link href="/create" className="mt-6 inline-flex items-center text-primary hover:text-primary/80 font-medium transition-colors">
                            Create Project Now
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </div>
                )}
            </section>
        </div>
    );
};

export default Dashboard;