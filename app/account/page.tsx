import Link from "next/link"
import { redirect } from "next/navigation"
import { UserMenu } from "@/components/auth/user-menu"
import { AccountClient } from "@/components/account/account-client"
import { getCurrentUser } from "@/lib/auth/current-user"

export default async function AccountPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  return (
    <main className="min-h-screen bg-bg-base text-text-primary">
      <header className="flex h-14 items-center justify-between border-b border-border-default bg-bg-surface px-4">
        <Link href="/editor" className="text-sm font-semibold text-text-primary">
          Ghost AI
        </Link>
        <UserMenu />
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">My Account</h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage your account verification and password.
          </p>
        </div>
        <AccountClient
          user={{
            email: user.email,
            emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
            emailVerified: user.emailVerified,
          }}
        />
      </div>
    </main>
  )
}
