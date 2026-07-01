"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type AuthMode = "sign-in" | "sign-up"

async function parseAuthError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null
  return body?.error ?? fallback
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isSignUp = mode === "sign-up"

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(
        isSignUp ? "/api/auth/register" : "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            ...(isSignUp ? { name } : {}),
          }),
        }
      )

      if (!response.ok) {
        throw new Error(
          await parseAuthError(
            response,
            isSignUp ? "Unable to create account" : "Unable to sign in"
          )
        )
      }

      router.replace("/editor")
      router.refresh()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : isSignUp
            ? "Unable to create account"
            : "Unable to sign in"
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-border-subtle bg-bg-surface p-6"
    >
      <div>
        <h1 className="text-xl font-semibold text-text-primary">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {isSignUp
            ? "Start designing collaborative architecture workspaces."
            : "Sign in to continue to your workspaces."}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {isSignUp ? (
          <label className="flex flex-col gap-1.5 text-sm text-text-secondary">
            Name
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              placeholder="Ada Lovelace"
            />
          </label>
        ) : null}

        <label className="flex flex-col gap-1.5 text-sm text-text-secondary">
          Email
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-text-secondary">
          Password
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
          />
        </label>
      </div>

      {error ? (
        <p className="rounded-lg border border-state-error/30 bg-state-error/10 px-3 py-2 text-sm text-state-error">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting
          ? isSignUp
            ? "Creating account..."
            : "Signing in..."
          : isSignUp
            ? "Create account"
            : "Sign in"}
      </Button>

      <p className="text-center text-sm text-text-muted">
        {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
        <Link
          href={isSignUp ? "/sign-in" : "/sign-up"}
          className="font-medium text-accent-primary hover:underline"
        >
          {isSignUp ? "Sign in" : "Sign up"}
        </Link>
      </p>

      {!isSignUp ? (
        <p className="text-center text-sm text-text-muted">
          <Link
            href="/forgot-password"
            className="font-medium text-accent-primary hover:underline"
          >
            Forgot password?
          </Link>
        </p>
      ) : null}
    </form>
  )
}
