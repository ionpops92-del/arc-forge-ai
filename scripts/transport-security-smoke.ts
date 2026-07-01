import { strict as assert } from "node:assert"
import {
  RuntimeConfigError,
  assertBrowserHttpUrl,
  assertBrowserWebSocketUrl,
} from "@/lib/config/runtime-env"
import { getPublicRealtimeUrl } from "@/lib/realtime/realtime-url"
import { POST as realtimeTokenPost } from "@/app/api/realtime/token/route"

const originalEnv = { ...process.env }

function resetEnv() {
  process.env = { ...originalEnv }
}

function expectRuntimeConfigError(fn: () => unknown) {
  assert.throws(fn, RuntimeConfigError)
}

async function main() {
  try {
    process.env.APP_ENV = "local"
    assert.equal(
      assertBrowserHttpUrl("http://localhost:3000", "APP_URL").toString(),
      "http://localhost:3000/"
    )
    assert.equal(
      assertBrowserWebSocketUrl(
        "ws://localhost:3001/ws",
        "NEXT_PUBLIC_REALTIME_URL"
      ).toString(),
      "ws://localhost:3001/ws"
    )

    process.env.APP_ENV = "staging"
    expectRuntimeConfigError(() =>
      assertBrowserHttpUrl("http://example.com", "APP_URL")
    )
    expectRuntimeConfigError(() =>
      assertBrowserWebSocketUrl("ws://example.com/ws", "NEXT_PUBLIC_REALTIME_URL")
    )
    assert.equal(
      assertBrowserHttpUrl("https://example.com", "APP_URL").toString(),
      "https://example.com/"
    )
    assert.equal(
      assertBrowserWebSocketUrl(
        "wss://example.com/ws",
        "NEXT_PUBLIC_REALTIME_URL"
      ).toString(),
      "wss://example.com/ws"
    )

    delete process.env.NEXT_PUBLIC_REALTIME_URL
    expectRuntimeConfigError(() => getPublicRealtimeUrl())

    process.env.APP_URL = "https://example.com"
    process.env.NEXT_PUBLIC_REALTIME_URL = "wss://example.com/ws"
    process.env.INTERNAL_REALTIME_TOKEN_SECRET =
      "transport-security-test-token-secret"

    const insecureResponse = await realtimeTokenPost(
      new Request("http://example.com/api/realtime/token", {
        method: "POST",
        body: JSON.stringify({ projectId: "project", roomId: "project" }),
        headers: { "content-type": "application/json" },
      })
    )
    assert.equal(insecureResponse.status, 403)

    const forwardedHttpsResponse = await realtimeTokenPost(
      new Request("http://example.com/api/realtime/token", {
        method: "POST",
        body: JSON.stringify({ projectId: "project", roomId: "project" }),
        headers: {
          "content-type": "application/json",
          "x-forwarded-proto": "https",
        },
      })
    )
    assert.equal(forwardedHttpsResponse.status, 401)

    console.log("transport security smoke passed")
  } finally {
    resetEnv()
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
