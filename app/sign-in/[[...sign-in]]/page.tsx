import { redirect } from "next/navigation"
import { AuthForm } from "@/components/auth/auth-form"
import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { getCurrentUser } from "@/lib/auth/current-user"

export default async function SignInPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect("/editor")
  }

  return (
    <AuthPageShell>
      <AuthForm mode="sign-in" />
    </AuthPageShell>
  )
}
