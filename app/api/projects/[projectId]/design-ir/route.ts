import { compileProjectDesignIr } from "@/lib/canvas/design-ir-project"
import { getCurrentProjectIdentity, userHasProjectAccess } from "@/lib/project-access"
import type { NextRequest } from "next/server"

type BooleanParseResult = boolean | "invalid"

function parseBooleanParam(
  value: string | null,
  fallback: boolean
): BooleanParseResult {
  if (value === null) return fallback
  if (["1", "true", "yes"].includes(value.toLowerCase())) return true
  if (["0", "false", "no"].includes(value.toLowerCase())) return false
  return "invalid"
}

function invalidQuery(message: string) {
  return Response.json({ error: message }, { status: 400 })
}

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/projects/[projectId]/design-ir">
) {
  const identity = await getCurrentProjectIdentity(request)
  if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId } = await ctx.params
  const hasAccess = await userHasProjectAccess(projectId, identity)
  if (!hasAccess) return Response.json({ error: "Not found" }, { status: 404 })

  const params = request.nextUrl.searchParams
  const format = params.get("format") ?? "json"
  const scope = params.get("scope") ?? "all"
  const includeValidation = parseBooleanParam(params.get("includeValidation"), true)
  const rootOnly = parseBooleanParam(params.get("rootOnly"), false)
  const download = parseBooleanParam(params.get("download"), false)

  if (format !== "json") return invalidQuery("Only format=json is supported")
  if (scope !== "all") return invalidQuery("Only scope=all is supported")
  if (includeValidation === "invalid") return invalidQuery("Invalid includeValidation")
  if (rootOnly === "invalid") return invalidQuery("Invalid rootOnly")
  if (download === "invalid") return invalidQuery("Invalid download")

  const result = await compileProjectDesignIr(projectId, {
    includeValidation,
    rootOnly,
  })
  const payload = {
    ir: result.ir,
    validation: result.validation,
    status: result.status,
    graphCount: result.graphCount,
    summary: result.summary,
  }

  if (download) {
    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="design-ir-${projectId}.json"`,
      },
    })
  }

  return Response.json(payload)
}
