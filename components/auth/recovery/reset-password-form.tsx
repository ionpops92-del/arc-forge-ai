"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

async function parseError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null
  return body?.error ?? fallback
}

export function ResetPasswordForm({ token }: { token: string | null }) {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(
    token ? null : "Missing password reset token."
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return

    setSubmitting(true)
    setError(null)

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.")
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      })

      if (!response.ok) {
        throw new Error(await parseError(response, "Unable to reset password"))
      }

      setNewPassword("")
      setConfirmPassword("")
      setSuccess(true)
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to reset password"
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
        <h1 className="text-xl font-semibold text-text-primary">Set new password</h1>
        <p className="mt-1 text-sm text-text-muted">
          Choose a new password for your Arc Forge AI account.
        </p>
      </div>

      {success ? (
        <div className="rounded-lg border border-state-success/30 bg-state-success/10 px-3 py-2 text-sm text-state-success">
          Password updated. You can sign in with your new password.
        </div>
      ) : (
        <>
          <label className="flex flex-col gap-1.5 text-sm text-text-secondary">
            New password
            <Input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              required
              disabled={!token}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm text-text-secondary">
            Confirm new password
            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
              disabled={!token}
            />
          </label>
        </>
      )}

      {error ? (
        <p className="rounded-lg border border-state-error/30 bg-state-error/10 px-3 py-2 text-sm text-state-error">
          {error}
        </p>
      ) : null}

      {!success ? (
        <Button type="submit" disabled={submitting || !token}>
          {submitting ? "Updating..." : "Update password"}
        </Button>
      ) : null}

      <p className="text-center text-sm text-text-muted">
        <Link href="/sign-in" className="font-medium text-accent-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  )
}
