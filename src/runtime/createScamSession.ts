import { createHuman, defineRuntime, SemanticEvent, SituationSpecification } from "@mozaik-ai/core"
import { createBrowserAgent } from "../agents/browserAgent"
import { createCallAgent } from "../agents/callAgent"
import { FEED_EVENTS } from "../agents/feedEvents"
import { createIdentityAgent } from "../agents/identityAgent"
import { createMessageAgent } from "../agents/messageAgent"
import { createInferenceProvider } from "../inference/createInference"
import type { BrowserPage, CallUtterance, IdentityLookup, InboundMessage } from "../shared/types"
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
				"scam-browser": 100,
				"scam-identity": 160,
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
	const browserAgent = createBrowserAgent(api)
	const identityAgent = createIdentityAgent(api)

	join(starter)
	join(feeder)
	join(observer)
	join(callAgent)
	join(messageAgent)
	join(browserAgent)
	join(identityAgent)

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
		browserAgent,
		identityAgent,
		start() {
			sendMessage("start concurrent scam agents", starter.getId())
		},
		injectCall(utterance: CallUtterance) {
			sendEvent(SemanticEvent.create(FEED_EVENTS.CALL, feeder.getId(), utterance), feeder.getId())
		},
		injectMessage(message: InboundMessage) {
			sendEvent(SemanticEvent.create(FEED_EVENTS.MESSAGE, feeder.getId(), message), feeder.getId())
		},
		injectBrowser(page: BrowserPage) {
			sendEvent(SemanticEvent.create(FEED_EVENTS.BROWSER, feeder.getId(), page), feeder.getId())
		},
		injectIdentity(lookup: IdentityLookup) {
			sendEvent(SemanticEvent.create(FEED_EVENTS.IDENTITY, feeder.getId(), lookup), feeder.getId())
		},
	}
}
