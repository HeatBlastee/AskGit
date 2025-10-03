"use client"

import { Button } from "@/components/ui/button"
import { useSignUp } from "@/hooks/use-signup"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

const SignUpPage = () => { // Renamed 'Page' to 'SignUpPage' for clarity
  const { mutate: signup, isPending: loading } = useSignUp()
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    signup(form, {
      onSuccess: () => {
        toast.success("Account Created")
        router.push("/")
      },
      onError: (err) => {
        toast.error(err.message)
      },
    })
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 px-4">
      {/* Decorative background circles */}
      <div className="absolute -top-10 -left-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-400/10 blur-3xl" />

      {/* --- askGit Branding --- */}
      <div className="z-10 mb-8 select-none">
        <span className="text-5xl font-extrabold tracking-tighter text-foreground drop-shadow-lg">
          ask
        </span>
        <span className="text-5xl font-extrabold tracking-tighter text-primary drop-shadow-lg">
          Git
        </span>
      </div>
      {/* ----------------------- */}

      <div className="z-10 w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 shadow-xl backdrop-blur-md transition hover:shadow-2xl">
        <h1 className="mb-2 text-center text-3xl font-extrabold tracking-tight text-foreground">
          Create an Account
        </h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Join us and get started in just a minute
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none ring-offset-background focus:border-primary focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none ring-offset-background focus:border-primary focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm shadow-sm outline-none ring-offset-background focus:border-primary focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-lg py-2 text-sm font-semibold tracking-wide transition-all hover:scale-[1.02]"
            disabled={loading}
          >
            {loading ? "Creating..." : "Sign Up"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage