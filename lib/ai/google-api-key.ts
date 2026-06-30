const GOOGLE_AI_API_KEY_ENV = "GOOGLE_AI_API_KEY"
const LEGACY_GOOGLE_AI_API_KEY_ENV = "GOOGLE_GENERATIVE_AI_API_KEY"

export function getGoogleAiApiKey() {
  const apiKey =
    process.env[GOOGLE_AI_API_KEY_ENV] ??
    process.env[LEGACY_GOOGLE_AI_API_KEY_ENV]

  if (!apiKey) {
    throw new Error(
      `Missing Google AI API key. Set ${GOOGLE_AI_API_KEY_ENV} or ${LEGACY_GOOGLE_AI_API_KEY_ENV}.`
    )
  }

  return apiKey
}
