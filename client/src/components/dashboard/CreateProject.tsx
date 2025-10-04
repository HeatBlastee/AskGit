"use client"

import { useCreateForm } from "@/hooks/use-create-project"
import { useForm } from "react-hook-form"
import type { CreateProjectInput } from "@/hooks/use-create-project"
import { toast } from "sonner"
import { Loader2, GitBranch, Github } from "lucide-react" // Import icons for polish
import { useRouter } from "next/navigation";

// Assuming you have components like Input, Label, and Button, 
// but using raw Tailwind for the provided structure
const CreateProject = () => {
    const { register, handleSubmit, reset } = useForm<CreateProjectInput>()

    const { mutate, isPending } = useCreateForm();

    const router = useRouter();

    const onSubmit = (data: CreateProjectInput) => {
        // Simple validation check before submitting
        if (!data.githubUrl.startsWith("http")) {
            toast.error("Please enter a valid GitHub repository URL.");
            return;
        }
        
        const res = mutate(data, {
            onSuccess: () => {
                toast.success("Project created successfully! Redirecting for analysis...");
                // In a real app, you'd likely router.push('/project/' + newProjectId) here
            },
            onError: (error) => {
                // Ensure error message is handled gracefully
                toast.error(error.message || "Failed to create project. Check your URL and token.");
            },
        });
    };


    return (
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4 md:p-8 bg-muted/30"> {/* Use a light background for contrast */}

            <form
                onSubmit={handleSubmit(onSubmit)}
                // Centered, constrained, modern card styling
                className="w-full max-w-lg bg-card border border-border rounded-xl p-6 sm:p-10 shadow-2xl transition-all duration-300 hover:shadow-primary/20 space-y-7"
            >
                {/* Card Header Section */}
                <div className="flex flex-col items-center text-center">
                    <div className="mb-3 p-3 rounded-full bg-primary/10 text-primary">
                        <Github className="h-8 w-8" />
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
                        Initialize New Project
                    </h2>
                    <p className="text-muted-foreground text-base mt-2">
                        Link your Git repository to begin analysis and collaboration.
                    </p>
                </div>

                {/* Project Name Input */}
                <div className="space-y-2">
                    <label
                        htmlFor="name"
                        className="block text-sm font-medium text-foreground"
                    >
                        Project Name
                    </label>
                    <input
                        id="name"
                        {...register("name", { required: true })}
                        type="text"
                        placeholder="e.g., AskGit Frontend"
                        className="w-full border border-input bg-background rounded-lg px-4 py-3 text-sm shadow-inner placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                </div>

                {/* Repository URL Input */}
                <div className="space-y-2">
                    <label
                        htmlFor="githubUrl"
                        className="block text-sm font-medium text-foreground"
                    >
                        Repository URL
                    </label>
                    <div className="relative">
                        <input
                            id="githubUrl"
                            {...register("githubUrl", { required: true })}
                            type="url" // Use type="url" for better mobile keyboard support
                            placeholder="https://github.com/user/repo"
                            className="w-full border border-input bg-background rounded-lg pl-10 pr-4 py-3 text-sm shadow-inner placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        />
                        <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground/80 pt-1">
                        Must be a valid GitHub or public Git repository URL.
                    </p>
                </div>

                {/* GitHub Token Input */}
                <div className="space-y-2">
                    <label
                        htmlFor="githubToken"
                        className="block text-sm font-medium text-foreground"
                    >
                        GitHub Token
                        <span className="text-muted-foreground/60 font-normal ml-1">(Optional for public repos)</span>
                    </label>
                    <input
                        id="githubToken"
                        {...register("githubToken")}
                        type="password"
                        placeholder="ghp_******************"
                        className="w-full border border-input bg-background rounded-lg px-4 py-3 text-sm shadow-inner placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className="w-full flex items-center justify-center bg-primary text-primary-foreground py-3 rounded-lg font-semibold shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={isPending}
                >
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing Repository...
                        </>
                    ) : (
                        "Create & Start Analysis"
                    )}
                </button>
            </form>
        </div>
    )
}

export default CreateProject