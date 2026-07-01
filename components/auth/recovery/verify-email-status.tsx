"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { CheckCircle2, ShieldAlert } from "lucide-react"

type VerificationState = "verifying" | "success" | "error"

async function parseError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null
  return body?.error ?? fallback
}

export function VerifyEmailStatus({ token }: { token: string | null }) {
  const requestedRef = useRef(false)
  const [state, setState] = useState<VerificationState>(
    token ? "verifying" : "error"
  )
  const [message, setMessage] = useState(
    token ? "Verifying your email..." : "Missing verification token."
  )

  useEffect(() => {
    if (!token || requestedRef.current) return
    requestedRef.current = true

    void fetch("/api/auth/verify-email/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            await parseError(response, "Invalid or expired verification link")
          )
        }

        setState("success")
        setMessage("Your email has been verified.")
      })
      .catch((error) => {
        setState("error")
        setMessage(
          error instanceof Error
            ? error.message
            : "Invalid or expired verification link"
        )
      })
  }, [token])

  const isSuccess = state === "success"

  return (
    <div className="flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-border-subtle bg-bg-surface p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-primary-dim">
          {isSuccess ? (
            <CheckCircle2 className="h-5 w-5 text-state-success" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-state-warning" />
          )}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            {isSuccess ? "Email verified" : "Email verification"}
          </h1>
          <p className="mt-1 text-sm text-text-muted">{message}</p>
        </div>
      </div>

      <div className="flex justify-center gap-4 text-sm">
        <Link href="/account" className="font-medium text-accent-primary hover:underline">
          My Account
        </Link>
        <Link href="/sign-in" className="font-medium text-accent-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  )
}
