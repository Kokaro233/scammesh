import { readInferenceEnv, shouldUseMockProvider } from "../inference/env"

export const SCAMMESH_AGENTS = ["call", "message", "browser", "device", "identity", "payment"] as const

export function healthPayload() {
	const env = readInferenceEnv()
	const mock = shouldUseMockProvider(env)

	return {
		ok: true,
		service: "scammesh",
		phase: 14,
		mockInferenceMode: mock,
		inferenceMode: mock ? "mock" : "live",
		mozaikRuntime: "active",
		agentCount: SCAMMESH_AGENTS.length,
		agents: [...SCAMMESH_AGENTS],
		scenarioMode: "deterministic",
	}
}
