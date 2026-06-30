import type { ReactNode } from "react"
import { BrainCircuit, Share2, ScrollText } from "lucide-react"

const features = [
  {
    icon: BrainCircuit,
    title: "AI Architecture Generation",
    description:
      "Describe your system, AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: Share2,
    title: "Real-time Collaboration",
    description:
      "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: ScrollText,
    title: "Instant Spec Generation",
    description:
      "Export a complete Markdown technical spec directly from the canvas graph.",
  },
]

export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col border-r border-border-default bg-bg-surface lg:flex">
        <div className="px-12 pt-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-primary">
              <span
                className="text-xs font-bold leading-none text-bg-base"
                style={{ fontFamily: "var(--font-geist-sans)" }}
              >
                G
              </span>
            </div>
            <span className="text-sm font-semibold text-text-primary">
              Ghost AI
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center px-12 py-16">
          <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight text-text-primary">
            Design systems at the
            <br />
            speed of thought.
          </h1>
          <p className="mb-12 max-w-sm text-base leading-relaxed text-text-secondary">
            Describe your architecture in plain English. Ghost AI maps it to a
            shared canvas your whole team can refine in real time.
          </p>

          <ul className="space-y-7">
            {features.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-primary-dim">
                  <Icon className="h-5 w-5 text-accent-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-snug text-text-primary">
                    {title}
                  </p>
                  <p className="mt-1 text-sm leading-snug text-text-muted">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-12 pb-10">
          <p className="text-xs text-text-faint">
            © 2026 Ghost AI. All rights reserved.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-bg-base p-8 lg:w-1/2">
        {children}
      </div>
    </main>
  )
}
