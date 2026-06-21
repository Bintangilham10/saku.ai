type ServerEnvironment = Readonly<Record<string, string | undefined>>

export function isClerkConfigured(environment: ServerEnvironment = process.env) {
  return Boolean(environment.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && environment.CLERK_SECRET_KEY)
}

export function isSupabaseConfigured(environment: ServerEnvironment = process.env) {
  return Boolean(environment.NEXT_PUBLIC_SUPABASE_URL && environment.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export function shouldUseDemoData(environment: ServerEnvironment = process.env) {
  return !isClerkConfigured(environment) || !isSupabaseConfigured(environment)
}

export function getConfiguredAiProvider(environment: ServerEnvironment = process.env) {
  if (environment.OPENAI_API_KEY) {
    return "OpenAI" as const
  }

  if (environment.ANTHROPIC_API_KEY) {
    return "Anthropic" as const
  }

  return null
}
