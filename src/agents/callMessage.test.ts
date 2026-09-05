import { describe, expect, it } from "vitest"
import { loopsOverlap } from "../runtime/createScamEnvironment"
import { createScamSession } from "../runtime/createScamSession"
import { loadScenario } from "../scenarios/loadScenario"
import { EVENT_TYPES } from "../runtime/events"

function wait(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

function mainCallCoercion() {
	const feed = loadScenario("bank-impersonation").feeds.find((item) => item.feedId === "call-coercion")
	if (!feed || feed.sourceChannel !== "call") {
		throw new Error("expected coercion utterance")
	}
	return feed.payload
}

function mainSms() {
	const feed = loadScenario("bank-impersonation").feeds.find((item) => item.sourceChannel === "message")
	if (!feed || feed.sourceChannel !== "message") {
		throw new Error("expected main SMS")
	}
	return feed.payload
}

describe("Call Agent and Message Agent", () => {
	it("keeps message risk low when Call does not emit coercion", async () => {
		const session = createScamSession()
		session.start()
		session.injectMessage(mainSms())
		await wait(280)

		const state = session.resolveRuntime().state
		expect(state.session.adaptations).toEqual([])
		expect(state.session.agentModes.message).toBe("NORMAL")
		expect(state.session.events.some((event) => event.type === EVENT_TYPES.SUSPICIOUS_LINK_DETECTED)).toBe(false)
		expect(
			state.analyzeLog.every((entry) => entry.agentId !== "call" || !("links" in (entry.payload as object))),
		).toBe(true)
	})

	it("lets Call change Message mid-loop and the same SMS becomes a suspicious link", async () => {
		const session = createScamSession()
		session.start()
		session.injectMessage(mainSms())
		session.injectCall(mainCallCoercion())
		await wait(320)

		const state = session.resolveRuntime().state
		expect(loopsOverlap(state.loops.call, state.loops.message)).toBe(true)
		expect(state.session.adaptations).toHaveLength(1)
		expect(state.session.adaptations[0]).toMatchObject({
			sourceAgent: "call",
			targetAgent: "message",
			triggerEvent: EVENT_TYPES.COERCION_DETECTED,
			beforeMode: "NORMAL",
			afterMode: "HEIGHTENED",
		})
		expect(state.session.events.some((event) => event.type === EVENT_TYPES.COERCION_DETECTED)).toBe(true)
		expect(state.session.events.some((event) => event.type === EVENT_TYPES.SUSPICIOUS_LINK_DETECTED)).toBe(true)
		expect(state.publishedTypes).toContain(EVENT_TYPES.COERCION_DETECTED)

		const callPayloads = state.analyzeLog.filter((entry) => entry.agentId === "call").map((entry) => entry.payload)
		const messagePayloads = state.analyzeLog
			.filter((entry) => entry.agentId === "message")
			.map((entry) => entry.payload)
		expect(
			callPayloads.every(
				(payload) => payload && typeof payload === "object" && "text" in payload && !("links" in payload),
			),
		).toBe(true)
		expect(
			messagePayloads.every(
				(payload) => payload && typeof payload === "object" && "links" in payload && !("speaker" in payload),
			),
		).toBe(true)
		expect(JSON.stringify(messagePayloads)).not.toContain("Do not hang up")
	})
})
