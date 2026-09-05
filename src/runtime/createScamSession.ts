import {
	createHuman,
	defineRuntime,
	SemanticEvent,
	SituationSpecification,
} from "@mozaik-ai/core"
import { createCallAgent } from "../agents/callAgent"
import { FEED_EVENTS } from "../agents/feedEvents"
import { createMessageAgent } from "../agents/messageAgent"
import { createInferenceProvider } from "../inference/createInference"
import type { CallUtterance, InboundMessage } from "../shared/types"
import { DelayedMockInferenceRunner } from "./dummy/runner"
import { ScamRuntimeState } from "./scamSessionState"

export function createScamSession() {
	const { initializeRuntime, resolveRuntime, resolveParticipant, join, leave, sendMessage, sendEvent, runLoop } =
		defineRuntime<ScamRuntimeState>()

	initializeRuntime({
		state: new ScamRuntimeState(),
		inferenceRunnerConfig: {
			runner: new DelayedMockInferenceRunner({
				"scam-call": 40,
				"scam-message": 200,
			}),
		},
	})

	const api = {
		runLoop,
		sendEvent,
		resolveRuntime,
		inference: createInferenceProvider(),
	}
	const starter = createHuman({ name: "Starter", capabilities: [], handlers: [] })
	const feeder = createHuman({ name: "Feeder", capabilities: [], handlers: [] })
	class WhenAnyEvent extends SituationSpecification {
		isSatisfiedBy(): boolean {
			return true
		}
	}

	const observer = createHuman({
		name: "Transcript",
		capabilities: [],
		handlers: [
			{
				specification: new WhenAnyEvent(),
				processor: {
					apply({ event }) {
						resolveRuntime().state.publishedTypes.push(event.type)
					},
				},
			},
		],
	})
	const callAgent = createCallAgent(api)
	const messageAgent = createMessageAgent(api)

	join(starter)
	join(feeder)
	join(observer)
	join(callAgent)
	join(messageAgent)

	return {
		resolveRuntime,
		resolveParticipant,
		join,
		leave,
		sendMessage,
		sendEvent,
		runLoop,
		starter,
		feeder,
		observer,
		callAgent,
		messageAgent,
		start() {
			sendMessage("start call and message agents", starter.getId())
		},
		injectCall(utterance: CallUtterance) {
			sendEvent(SemanticEvent.create(FEED_EVENTS.CALL, feeder.getId(), utterance), feeder.getId())
		},
		injectMessage(message: InboundMessage) {
			sendEvent(SemanticEvent.create(FEED_EVENTS.MESSAGE, feeder.getId(), message), feeder.getId())
		},
	}
}
