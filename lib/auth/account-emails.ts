import "server-only"

import { getAppUrl } from "@/lib/config/runtime-env"
import { getEmailProviderName, isDevConsoleEmailMode, sendEmail } from "@/lib/email/email-provider"

function buildAuthLink(pathname: string, token: string) {
  const url = new URL(pathname, getAppUrl())
  url.searchParams.set("token", token)
  return url.toString()
}

export function buildVerificationLink(token: string) {
  return buildAuthLink("/verify-email", token)
}

export function buildPasswordResetLink(token: string) {
  return buildAuthLink("/reset-password", token)
}

export function canExposeDevAuthLink() {
  return isDevConsoleEmailMode()
}

export async function sendVerificationEmail(input: {
  to: string
  token: string
}) {
  const link = buildVerificationLink(input.token)

  await sendEmail({
    to: input.to,
    subject: "Verify your Arc Forge AI account",
    text: [
      "Verify your Arc Forge AI account by opening this link:",
      "",
      link,
      "",
      "This link expires in 24 hours. If you did not request it, you can ignore this email.",
    ].join("\n"),
  })

  return {
    link,
    provider: getEmailProviderName(),
  }
}

export async function sendPasswordResetEmail(input: {
  to: string
  token: string
}) {
  const link = buildPasswordResetLink(input.token)

  await sendEmail({
    to: input.to,
    subject: "Reset your Arc Forge AI password",
    text: [
      "Reset your Arc Forge AI password by opening this link:",
      "",
      link,
      "",
      "This link expires in 1 hour. If you did not request it, you can ignore this email.",
    ].join("\n"),
  })

  return {
    link,
    provider: getEmailProviderName(),
  }
}
