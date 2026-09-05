import { type Agent, type InferenceInput } from "@mozaik-ai/core"
import type { DummySessionApi } from "./session"

export function inferenceInput(agent: Agent, model: string): InferenceInput {
	return {
		model,
		context: agent.getMemory().getContext(),
		tools: agent.getTools(),
	}
}

export function startDummyTurn(api: DummySessionApi, agent: Agent, message: string, model: string): void {
	api.runLoop(agent.getId(), message, inferenceInput(agent, model))
}
