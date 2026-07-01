import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { ForgotPasswordForm } from "@/components/auth/recovery/forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell>
      <ForgotPasswordForm />
    </AuthPageShell>
  )
}
