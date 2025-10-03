"use client"

import { useCreateForm } from "@/hooks/use-create-project"
import { useForm } from "react-hook-form"
import type { CreateProjectInput } from "@/hooks/use-create-project"
import { toast } from "sonner"



const CreateProject = () => {
    const { register, handleSubmit, reset } = useForm<CreateProjectInput>()

    const { mutate, isPending } = useCreateForm();
    const onSubmit = (data: CreateProjectInput) => {
        mutate(data, {
            onSuccess: () => {
                toast.success("Project created successfully!");
                reset();
            },
            onError: (error) => {
                toast.error(error.message || "Failed to create project");
            },
        });

    };


    return (
        <div className="flex items-center justify-center gap-12 h-full w-full px-8 ">
            {/* Left side image */}
            <div className="w-1/3 hidden md:block">
                <img
                    src="/img1.jpg"
                    alt="Project illustration"
                    className="w-full rounded-2xl shadow-xl"
                />
            </div>

            
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="w-full md:w-1/2 lg:w-1/3 bg-white p-8 rounded-2xl shadow-lg border  space-y-6"
            >
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900">Create Project</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Link your Github Repositary
                    </p>
                </div>

      
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Project Name
                    </label>
                    <input
                        {...register("name", { required: true })}
                        type="text"
                        placeholder="Project Name"
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                </div>


                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Repository URL
                    </label>
                    <input
                        {...register("githubUrl", { required: true })}
                        type="text"
                        placeholder="https://github.com/user/repo"
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        GitHub Token <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                        {...register("githubToken")}
                        type="password"
                        placeholder="Enter token if required"
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                </div>

    
                <button
                    type="submit"
                    className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition"
                    disabled={isPending}

                >
                    {isPending ? "Creating..." : "Create"}

                </button>
            </form>
        </div>
    )
}

export default CreateProject
