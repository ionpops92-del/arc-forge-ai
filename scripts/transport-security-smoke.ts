import { strict as assert } from "node:assert"
import {
  RuntimeConfigError,
  assertBrowserHttpUrl,
  assertBrowserWebSocketUrl,
} from "@/lib/config/runtime-env"
import { assertPublicBrowserWebSocketUrl } from "@/lib/config/public-runtime-env"
import { getInternalRealtimePublishUrl } from "@/lib/realtime/internal-realtime-url"
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
    process.env.NEXT_PUBLIC_APP_ENV = "local"
    assert.equal(
      assertBrowserHttpUrl("http://localhost:3000", "APP_URL").toString(),
      "http://localhost:3000/"
    )
    assert.equal(
      assertPublicBrowserWebSocketUrl(
        "ws://localhost:3001/ws",
        "NEXT_PUBLIC_REALTIME_URL",
        "localhost"
      ).toString(),
      "ws://localhost:3001/ws"
    )
    assert.equal(
      assertBrowserWebSocketUrl(
        "ws://localhost:3001/ws",
        "SERVER_REALTIME_URL"
      ).toString(),
      "ws://localhost:3001/ws"
    )
    delete process.env.NEXT_PUBLIC_REALTIME_URL
    assert.equal(getPublicRealtimeUrl(), "ws://localhost:3001/ws")
    delete process.env.INTERNAL_REALTIME_INTERNAL_URL
    assert.equal(
      getInternalRealtimePublishUrl(),
      "http://localhost:3001/internal/broadcast"
    )

    process.env.APP_ENV = "staging"
    process.env.NEXT_PUBLIC_APP_ENV = "staging"
    expectRuntimeConfigError(() =>
      assertBrowserHttpUrl("http://example.com", "APP_URL")
    )
    expectRuntimeConfigError(() =>
      assertPublicBrowserWebSocketUrl(
        "ws://example.com/ws",
        "NEXT_PUBLIC_REALTIME_URL",
        "example.com"
      )
    )
    assert.equal(
      assertBrowserHttpUrl("https://example.com", "APP_URL").toString(),
      "https://example.com/"
    )
    assert.equal(
      assertPublicBrowserWebSocketUrl(
        "wss://example.com/ws",
        "NEXT_PUBLIC_REALTIME_URL",
        "example.com"
      ).toString(),
      "wss://example.com/ws"
    )
    expectRuntimeConfigError(() =>
      assertPublicBrowserWebSocketUrl(
        "ws://localhost:3001/ws",
        "NEXT_PUBLIC_REALTIME_URL",
        "example.com"
      )
    )
    expectRuntimeConfigError(() => getInternalRealtimePublishUrl())
    process.env.INTERNAL_REALTIME_INTERNAL_URL =
      "http://realtime:3001/internal/broadcast"
    assert.equal(
      getInternalRealtimePublishUrl(),
      "http://realtime:3001/internal/broadcast"
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
