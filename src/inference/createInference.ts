import { readInferenceEnv, shouldUseMockProvider, type InferenceEnv } from "./env"
import { LlmInferenceProvider } from "./llmProvider"
import { MockInferenceProvider } from "./mockProvider"
import type { InferenceProvider } from "./provider"

export function createInferenceProvider(source: NodeJS.ProcessEnv = process.env): InferenceProvider {
	const env = readInferenceEnv(source)
	return createInferenceProviderFromEnv(env)
}

export function createInferenceProviderFromEnv(env: InferenceEnv): InferenceProvider {
	const mock = new MockInferenceProvider()
	if (shouldUseMockProvider(env)) {
		return mock
	}

	return new LlmInferenceProvider(env, mock)
}
