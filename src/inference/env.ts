export interface InferenceEnv {
	provider: string
	apiKey: string
	model: string
	baseUrl: string
	mockInferenceMode: boolean
}

export function readInferenceEnv(source: NodeJS.ProcessEnv = process.env): InferenceEnv {
	return {
		provider: source.LLM_PROVIDER?.trim() ?? "",
		apiKey: source.LLM_API_KEY?.trim() ?? "",
		model: source.LLM_MODEL?.trim() ?? "",
		baseUrl: source.LLM_BASE_URL?.trim() ?? "",
		mockInferenceMode: source.MOCK_INFERENCE_MODE !== "false",
	}
}

export function shouldUseMockProvider(env: InferenceEnv): boolean {
	if (env.mockInferenceMode) {
		return true
	}

	return env.provider.length === 0 || env.apiKey.length === 0 || env.model.length === 0
}

export function describeMissingProvider(env: InferenceEnv): string {
	const missing = [
		!env.provider ? "LLM_PROVIDER" : undefined,
		!env.apiKey ? "LLM_API_KEY" : undefined,
		!env.model ? "LLM_MODEL" : undefined,
	].filter((name): name is string => Boolean(name))

	return `LLM adapter is not configured (${missing.join(", ") || "incomplete"}). Falling back to MOCK_INFERENCE_MODE.`
}
