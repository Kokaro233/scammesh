import { describeMissingProvider, type InferenceEnv } from "./env"
import type { AnalyzeInput, InferenceContext, InferenceProvider } from "./provider"
import { ANALYSIS_SCHEMA, validateAnalysisResult, type AnalysisResult } from "./schema"

export class LlmInferenceProvider implements InferenceProvider {
	constructor(
		private readonly env: InferenceEnv,
		private readonly fallback: InferenceProvider,
		private readonly fetchImpl: typeof fetch = fetch,
	) {}

	async analyze(
		input: AnalyzeInput,
		schema: typeof ANALYSIS_SCHEMA,
		context: InferenceContext,
	): Promise<AnalysisResult> {
		if (!this.env.provider || !this.env.apiKey || !this.env.model) {
			const fallback = await this.fallback.analyze(input, schema, context)
			return {
				...fallback,
				provider: "mock",
				usedFallback: true,
			}
		}

		if (!this.env.baseUrl) {
			const fallback = await this.fallback.analyze(input, schema, context)
			return {
				...fallback,
				provider: "mock",
				usedFallback: true,
			}
		}

		try {
			const response = await this.fetchImpl(new URL("/chat/completions", this.env.baseUrl), {
				method: "POST",
				headers: {
					"content-type": "application/json",
					authorization: `Bearer ${this.env.apiKey}`,
				},
				body: JSON.stringify({
					model: this.env.model,
					messages: [
						{
							role: "system",
							content:
								"Return only JSON that matches the provided analysis schema. Do not write secrets.",
						},
						{
							role: "user",
							content: JSON.stringify({ input, context, schema }),
						},
					],
					response_format: { type: "json_object" },
				}),
			})

			if (!response.ok) {
				throw new Error(`LLM provider returned HTTP ${response.status}`)
			}

			const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
			const content = body.choices?.[0]?.message?.content
			if (!content) {
				throw new Error("LLM provider returned an empty message")
			}

			return validateAnalysisResult({
				...JSON.parse(content),
				provider: "llm",
				usedFallback: false,
			})
		} catch {
			const fallback = await this.fallback.analyze(input, schema, context)
			return {
				...fallback,
				provider: "mock",
				usedFallback: true,
			}
		}
	}

	missingConfigurationMessage() {
		return describeMissingProvider(this.env)
	}
}
