"use client"

import { LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useCurrentUser } from "@/hooks/use-current-user"
import { cn } from "@/lib/utils"

function getInitials(nameOrEmail: string) {
  const source = nameOrEmail.includes("@")
    ? nameOrEmail.split("@")[0]
    : nameOrEmail

  return source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const { user } = useCurrentUser()
  const label = user?.name || user?.email || "Account"
  const initials = getInitials(label)

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null)
    router.replace("/sign-in")
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={compact ? handleLogout : undefined}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-bg-elevated text-xs font-semibold text-text-primary",
          compact && "hover:bg-bg-subtle"
        )}
        title={compact ? `Sign out ${label}` : label}
      >
        {initials}
      </button>

      {!compact ? (
        <>
          <Link
            href="/account"
            className="rounded-lg px-2.5 py-1 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-subtle hover:text-text-primary"
          >
            Account
          </Link>
          <Button variant="ghost" size="sm" className="gap-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </>
      ) : null}
    </div>
  )
}
