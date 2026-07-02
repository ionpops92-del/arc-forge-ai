"use client"

import { LogOut, User as UserIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useId, useRef, useState } from "react"
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
  const [compactOpen, setCompactOpen] = useState(false)
  const compactMenuId = useId()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const label = user?.name || user?.email || "Account"
  const initials = getInitials(label)

  useEffect(() => {
    if (!compact || !compactOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target

      if (target instanceof Node && !rootRef.current?.contains(target)) {
        setCompactOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCompactOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [compact, compactOpen])

  async function handleLogout() {
    setCompactOpen(false)
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null)
    router.replace("/sign-in")
    router.refresh()
  }

  return (
    <div ref={rootRef} className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={compact ? () => setCompactOpen((open) => !open) : undefined}
        aria-label={compact ? "Account menu" : undefined}
        aria-haspopup={compact ? "menu" : undefined}
        aria-expanded={compact ? compactOpen : undefined}
        aria-controls={compact && compactOpen ? compactMenuId : undefined}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-bg-elevated text-xs font-semibold text-text-primary",
          compact &&
            "transition-colors hover:border-accent-primary/50 hover:bg-accent-primary-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/45",
          compactOpen && "border-accent-primary/60 bg-accent-primary-dim text-accent-primary"
        )}
        title={label}
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

      {compact && compactOpen ? (
        <div
          id={compactMenuId}
          role="menu"
          aria-label="Account actions"
          className="absolute right-0 top-10 z-[70] w-44 overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface/95 p-1.5 shadow-[0_18px_40px_var(--color-accent-primary-dim)] ring-1 ring-accent-primary/15 backdrop-blur-xl"
        >
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setCompactOpen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary focus:bg-bg-elevated focus:text-text-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-accent-primary/45"
          >
            <UserIcon className="h-4 w-4 text-accent-primary" aria-hidden="true" />
            <span>Account</span>
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary focus:bg-bg-elevated focus:text-text-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-accent-primary/45"
          >
            <LogOut className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}
