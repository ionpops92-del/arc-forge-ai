import "server-only"

import nodemailer from "nodemailer"
import { RuntimeConfigError, getRequiredEnv, isLocalAppEnv } from "@/lib/config/runtime-env"

export type EmailProviderName = "dev_console" | "smtp"

export interface EmailMessage {
  to: string
  subject: string
  text: string
  html?: string
}

export interface EmailProvider {
  readonly name: EmailProviderName
  send(message: EmailMessage): Promise<void>
}

function parseEmailProviderName(): EmailProviderName {
  const configured = process.env.EMAIL_PROVIDER?.trim()
  if (!configured) return isLocalAppEnv() ? "dev_console" : "smtp"
  if (configured === "dev_console" || configured === "smtp") return configured

  throw new RuntimeConfigError("EMAIL_PROVIDER must be either dev_console or smtp")
}

export function getEmailProviderName() {
  return parseEmailProviderName()
}

export function isDevConsoleEmailMode() {
  return isLocalAppEnv() && getEmailProviderName() === "dev_console"
}

function getEmailFrom(providerName: EmailProviderName) {
  const configured = process.env.EMAIL_FROM?.trim()
  if (configured) return configured
  if (providerName === "dev_console") return "Arc Forge AI <no-reply@localhost>"

  throw new RuntimeConfigError("EMAIL_FROM must be set when EMAIL_PROVIDER=smtp")
}

function parseSmtpPort() {
  const rawPort = getRequiredEnv("SMTP_PORT")
  const port = Number.parseInt(rawPort, 10)

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new RuntimeConfigError("SMTP_PORT must be a valid TCP port")
  }

  return port
}

function parseSmtpSecure() {
  const rawSecure = getRequiredEnv("SMTP_SECURE").toLowerCase()
  if (rawSecure === "true") return true
  if (rawSecure === "false") return false

  throw new RuntimeConfigError("SMTP_SECURE must be true or false")
}

class DevConsoleEmailProvider implements EmailProvider {
  readonly name = "dev_console" as const

  async send(message: EmailMessage) {
    if (!isLocalAppEnv()) {
      throw new RuntimeConfigError("EMAIL_PROVIDER=dev_console is allowed only when APP_ENV=local")
    }

    console.info("[email:dev_console] Email delivery", {
      from: getEmailFrom("dev_console"),
      to: message.to,
      subject: message.subject,
      text: message.text,
    })
  }
}

class SmtpEmailProvider implements EmailProvider {
  readonly name = "smtp" as const

  async send(message: EmailMessage) {
    const transport = nodemailer.createTransport({
      host: getRequiredEnv("SMTP_HOST"),
      port: parseSmtpPort(),
      secure: parseSmtpSecure(),
      auth: {
        user: getRequiredEnv("SMTP_USER"),
        pass: getRequiredEnv("SMTP_PASSWORD"),
      },
    })

    await transport.sendMail({
      from: getEmailFrom("smtp"),
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    })
  }
}

export function assertEmailDeliveryConfigured() {
  const providerName = getEmailProviderName()
  getEmailFrom(providerName)

  if (providerName === "dev_console") {
    if (!isLocalAppEnv()) {
      throw new RuntimeConfigError("EMAIL_PROVIDER=dev_console is allowed only when APP_ENV=local")
    }
    return
  }

  getRequiredEnv("SMTP_HOST")
  parseSmtpPort()
  getRequiredEnv("SMTP_USER")
  getRequiredEnv("SMTP_PASSWORD")
  parseSmtpSecure()
}

export function getEmailProvider(): EmailProvider {
  const providerName = getEmailProviderName()

  if (providerName === "dev_console") {
    return new DevConsoleEmailProvider()
  }

  return new SmtpEmailProvider()
}

export async function sendEmail(message: EmailMessage) {
  assertEmailDeliveryConfigured()

  const provider = getEmailProvider()
  await provider.send(message)
}
