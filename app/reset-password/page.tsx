import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { ResetPasswordForm } from "@/components/auth/recovery/reset-password-form"

interface ResetPasswordPageProps {
  searchParams: Promise<{
    token?: string | string[]
  }>
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams
  const token = Array.isArray(params.token) ? params.token[0] : params.token

  return (
    <AuthPageShell>
      <ResetPasswordForm token={token ?? null} />
    </AuthPageShell>
  )
}
