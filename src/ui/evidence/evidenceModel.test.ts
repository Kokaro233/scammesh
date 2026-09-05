import { describe, expect, it } from "vitest"
import { EVENT_TYPES } from "../../runtime/events"
import { createInitialSessionState } from "../../runtime/sessionState"
import { adaptationChain, consumersOf, evidenceByChannel, whyNotSingleChannel } from "./evidenceModel"

describe("evidence model", () => {
	it("traces who produced an event and which agent used it", () => {
		const session = createInitialSessionState()
		session.events.push({
			eventId: "call-1",
			type: EVENT_TYPES.COERCION_DETECTED,
			producerId: "call",
			occurredAt: 1,
			severity: "high",
			confidence: 0.9,
			channel: "call",
			entityRefs: [],
			summary: "Do not hang up",
			payload: { tactic: "do-not-hang-up", excerpt: "Do not hang up" },
		})
		session.adaptations.push({
			adaptationId: "adapt-1",
			sourceAgent: "call",
			targetAgent: "message",
			triggerEvent: EVENT_TYPES.COERCION_DETECTED,
			triggerEventId: "call-1",
			beforeMode: "NORMAL",
			afterMode: "HEIGHTENED",
			reason: "Message Agent adapted because Call Agent emitted coercion_detected",
			occurredAt: 2,
		})

		expect(consumersOf(session.events[0], session)).toEqual(["message"])
		expect(evidenceByChannel(session)[0]?.items[0]).toMatchObject({
			producedBy: "call",
			usedBy: ["message"],
		})
		expect(adaptationChain(session)[0]?.text).toContain("Call Agent emitted coercion_detected")
		expect(adaptationChain(session)[0]?.text).toContain("Message Agent HEIGHTENED")
	})

	it("explains a multi-channel case is not a one-channel false alarm", () => {
		const session = createInitialSessionState()
		session.riskSnapshots.push({
			snapshotId: "risk-1",
			occurredAt: 1,
			score: 80,
			level: "CRITICAL",
			reasons: [
				"+12 coercion detected",
				"+15 synergy: coercion + suspicious link",
				"+15 channel-count bonus (4 channels)",
			],
			channelsInvolved: ["call", "message", "browser", "identity"],
		})

		const why = whyNotSingleChannel(session)
		expect(why.channelCount).toBe(4)
		expect(why.explain).toContain("not a single-channel alert")
		expect(why.synergies.length).toBeGreaterThan(0)
	})
})
