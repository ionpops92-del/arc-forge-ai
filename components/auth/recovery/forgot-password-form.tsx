"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const GENERIC_SUCCESS =
  "If that email is registered, a password reset link has been sent."

async function parseError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null
  return body?.error ?? fallback
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [devLink, setDevLink] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage(null)
    setError(null)
    setDevLink(null)

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error(await parseError(response, "Unable to request password reset"))
      }

      const body = (await response.json()) as { devOnlyResetLink?: string }
      setMessage(GENERIC_SUCCESS)
      setDevLink(body.devOnlyResetLink ?? null)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to request password reset"
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
        <h1 className="text-xl font-semibold text-text-primary">Reset password</h1>
        <p className="mt-1 text-sm text-text-muted">
          Enter your email and we will send a reset link if the account exists.
        </p>
      </div>

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

      {message ? (
        <p className="rounded-lg border border-state-success/30 bg-state-success/10 px-3 py-2 text-sm text-state-success">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-state-error/30 bg-state-error/10 px-3 py-2 text-sm text-state-error">
          {error}
        </p>
      ) : null}
      {devLink ? (
        <a
          href={devLink}
          className="break-all rounded-xl border border-accent-primary/30 bg-accent-primary-dim p-3 text-sm text-accent-primary hover:underline"
        >
          {devLink}
        </a>
      ) : null}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Sending..." : "Send reset link"}
      </Button>

      <p className="text-center text-sm text-text-muted">
        <Link href="/sign-in" className="font-medium text-accent-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  )
}
