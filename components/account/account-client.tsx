"use client"

import { useState } from "react"
import { CheckCircle2, Mail, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AccountUser {
  email: string
  emailVerifiedAt: string | null
  emailVerified: boolean
}

async function parseError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null
  return body?.error ?? fallback
}

export function AccountClient({ user }: { user: AccountUser }) {
  const [emailVerified] = useState(user.emailVerified)
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null)
  const [verificationLink, setVerificationLink] = useState<string | null>(null)
  const [verificationSubmitting, setVerificationSubmitting] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)

  async function requestVerification() {
    setVerificationSubmitting(true)
    setVerificationMessage(null)
    setVerificationLink(null)

    try {
      const response = await fetch("/api/auth/verify-email/request", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(await parseError(response, "Unable to send verification email"))
      }

      const body = (await response.json()) as {
        devOnlyVerificationLink?: string
      }
      setVerificationMessage("Verification email sent.")
      setVerificationLink(body.devOnlyVerificationLink ?? null)
    } catch (error) {
      setVerificationMessage(
        error instanceof Error ? error.message : "Unable to send verification email"
      )
    } finally {
      setVerificationSubmitting(false)
    }
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordSubmitting(true)
    setPasswordMessage(null)
    setPasswordError(null)

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.")
      setPasswordSubmitting(false)
      return
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (!response.ok) {
        throw new Error(await parseError(response, "Unable to update password"))
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setPasswordMessage("Password updated.")
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : "Unable to update password"
      )
    } finally {
      setPasswordSubmitting(false)
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.15fr]">
      <section className="rounded-2xl border border-border-subtle bg-bg-surface p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-primary-dim">
            <Mail className="h-5 w-5 text-accent-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Email</h2>
            <p className="mt-1 text-sm text-text-muted">{user.email}</p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-border-default bg-bg-elevated p-4">
          {emailVerified ? (
            <div className="flex items-center gap-2 text-sm text-state-success">
              <CheckCircle2 className="h-4 w-4" />
              Email verified
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-state-warning">
              <ShieldAlert className="h-4 w-4" />
              Email not verified
            </div>
          )}
        </div>

        {!emailVerified ? (
          <div className="mt-5 flex flex-col gap-3">
            <Button
              type="button"
              onClick={requestVerification}
              disabled={verificationSubmitting}
            >
              {verificationSubmitting ? "Sending..." : "Send verification email"}
            </Button>
            {verificationMessage ? (
              <p className="text-sm text-text-muted">{verificationMessage}</p>
            ) : null}
            {verificationLink ? (
              <a
                href={verificationLink}
                className="break-all rounded-xl border border-accent-primary/30 bg-accent-primary-dim p-3 text-sm text-accent-primary hover:underline"
              >
                {verificationLink}
              </a>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border-subtle bg-bg-surface p-6">
        <h2 className="text-lg font-semibold text-text-primary">Change Password</h2>
        <form onSubmit={changePassword} className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm text-text-secondary">
            Current password
            <Input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-text-secondary">
            New password
            <Input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              required
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
            />
          </label>

          {passwordError ? (
            <p className="rounded-lg border border-state-error/30 bg-state-error/10 px-3 py-2 text-sm text-state-error">
              {passwordError}
            </p>
          ) : null}
          {passwordMessage ? (
            <p className="rounded-lg border border-state-success/30 bg-state-success/10 px-3 py-2 text-sm text-state-success">
              {passwordMessage}
            </p>
          ) : null}

          <Button type="submit" disabled={passwordSubmitting}>
            {passwordSubmitting ? "Updating..." : "Update password"}
          </Button>
        </form>
      </section>
    </div>
  )
}
