import { afterEach, describe, expect, it } from "vitest"
import { healthPayload, SCAMMESH_AGENTS } from "./health"

describe("healthPayload", () => {
	const previous = {
		mock: process.env.MOCK_INFERENCE_MODE,
		provider: process.env.LLM_PROVIDER,
		key: process.env.LLM_API_KEY,
		model: process.env.LLM_MODEL,
	}

	afterEach(() => {
		restore("MOCK_INFERENCE_MODE", previous.mock)
		restore("LLM_PROVIDER", previous.provider)
		restore("LLM_API_KEY", previous.key)
		restore("LLM_MODEL", previous.model)
	})

	it("reports mock inference and live runtime diagnostics", () => {
		process.env.MOCK_INFERENCE_MODE = "true"
		expect(healthPayload()).toEqual({
			ok: true,
			service: "scammesh",
			phase: 14,
			mockInferenceMode: true,
			inferenceMode: "mock",
			mozaikRuntime: "active",
			agentCount: 6,
			agents: [...SCAMMESH_AGENTS],
			scenarioMode: "deterministic",
		})
	})

	it("reports live inference only when mock is off and the adapter is configured", () => {
		process.env.MOCK_INFERENCE_MODE = "false"
		process.env.LLM_PROVIDER = "openai"
		process.env.LLM_API_KEY = "sk-test"
		process.env.LLM_MODEL = "gpt-4"
		expect(healthPayload()).toMatchObject({
			mockInferenceMode: false,
			inferenceMode: "live",
			mozaikRuntime: "active",
			agentCount: 6,
		})
	})
})

function restore(name: string, value: string | undefined) {
	if (value === undefined) {
		delete process.env[name]
		return
	}
	process.env[name] = value
}
