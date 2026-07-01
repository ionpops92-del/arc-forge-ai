import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { VerifyEmailStatus } from "@/components/auth/recovery/verify-email-status"

interface VerifyEmailPageProps {
  searchParams: Promise<{
    token?: string | string[]
  }>
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const params = await searchParams
  const token = Array.isArray(params.token) ? params.token[0] : params.token

  return (
    <AuthPageShell>
      <VerifyEmailStatus token={token ?? null} />
    </AuthPageShell>
  )
}
