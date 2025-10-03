import { API_PATHS } from "@/lib/paths"
import { useMutation } from "@tanstack/react-query"

interface SignInData {
    email: string
    password: string
}

export const useSignIn = () => {
    return useMutation({
        mutationFn: async (userData: SignInData) => {
            const res = await fetch(API_PATHS.LOGIN, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userData),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Sign in failed")
            }

            return data 
        },
    })
}
