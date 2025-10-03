import { API_PATHS } from "@/lib/paths"
import { useMutation } from "@tanstack/react-query"

export const useSignUp = () => {
    return useMutation({
        mutationFn: async (userData: { email: string; password: string; name:string }) => {
            const res = await fetch(API_PATHS.SIGN_UP, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userData),

            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Signup failed")
            }

            return data;
        }
    })
}