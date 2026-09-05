import { createHuman, defineRuntime } from "@mozaik-ai/core"
import { createAlpha } from "./dummy/participants/alpha"
import { createBeta } from "./dummy/participants/beta"
import { DelayedMockInferenceRunner } from "./dummy/runner"
import { DummyRuntimeState } from "./dummy/state"
import { createRecordEventHandler } from "./dummy/situations/record-event"

export function createScamEnvironment() {
	const { initializeRuntime, resolveRuntime, resolveParticipant, join, leave, sendMessage, sendEvent, runLoop } =
		defineRuntime<DummyRuntimeState>()

	initializeRuntime({
		state: new DummyRuntimeState(),
		inferenceRunnerConfig: {
			runner: new DelayedMockInferenceRunner({
				"dummy-alpha": 40,
				"dummy-beta": 180,
			}),
		},
	})

	const api = { runLoop, sendEvent, resolveRuntime }
	const starter = createHuman({ name: "Starter", capabilities: [], handlers: [] })
	const observer = createHuman({
		name: "Transcript",
		capabilities: [],
		handlers: [createRecordEventHandler(api)],
	})
	const alpha = createAlpha(api)
	const beta = createBeta(api)

	join(starter)
	join(observer)
	join(alpha)
	join(beta)

	return {
		resolveRuntime,
		resolveParticipant,
		join,
		leave,
		sendMessage,
		sendEvent,
		runLoop,
		starter,
		observer,
		alpha,
		beta,
		start() {
			sendMessage("start concurrent dummy loops", starter.getId())
		},
	}
}

export function loopsOverlap(
	left: { startedAt?: number; endedAt?: number },
	right: { startedAt?: number; endedAt?: number },
) {
	if (
		left.startedAt === undefined ||
		left.endedAt === undefined ||
		right.startedAt === undefined ||
		right.endedAt === undefined
	) {
		return false
	}

	return left.startedAt < right.endedAt && right.startedAt < left.endedAt
}
