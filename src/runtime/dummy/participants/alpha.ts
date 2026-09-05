import { createAgent } from "@mozaik-ai/core"
import type { DummySessionApi } from "../session"
import { createInferenceStartedHandler } from "../situations/inference-started"
import { createMessageSentHandler } from "../situations/message-sent"
import { createOwnAnswerHandler } from "../situations/own-answer"

export function createAlpha(api: DummySessionApi) {
	return createAgent({
		name: "alpha",
		capabilities: ["inference"],
		instruction:
			"You are dummy alpha. Your only job is to think when a teammate speaks and emit a signal when you answer.",
		tools: [],
		handlers: [
			createMessageSentHandler(api, "dummy-alpha"),
			createInferenceStartedHandler(api, "alpha"),
			createOwnAnswerHandler(api, "alpha", true),
		],
	})
}
