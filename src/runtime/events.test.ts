import { describe, expect, it } from "vitest"
import { createScamEvent, EVENT_TYPE_VALUES, EVENT_TYPES, isSemanticEventType } from "./events"

describe("semantic event schema", () => {
	it("keeps event type constants unique and closed", () => {
		expect(new Set(EVENT_TYPE_VALUES).size).toBe(EVENT_TYPE_VALUES.length)
		expect(isSemanticEventType("coercion_detected")).toBe(true)
		expect(isSemanticEventType("not_a_real_event")).toBe(false)
	})

	it("creates a typed event and rejects invalid confidence", () => {
		const event = createScamEvent({
			eventId: "evt-1",
			type: EVENT_TYPES.COERCION_DETECTED,
			producerId: "call",
			occurredAt: 4_000,
			severity: "high",
			confidence: 0.9,
			channel: "call",
			entityRefs: [],
			summary: "Caller told the user not to hang up.",
			payload: { tactic: "do-not-hang-up", excerpt: "Do not hang up." },
		})

		expect(event.type).toBe("coercion_detected")
		expect(event.payload.tactic).toBe("do-not-hang-up")
		expect(() =>
			createScamEvent({
				eventId: "evt-bad",
				type: EVENT_TYPES.URGENCY_DETECTED,
				producerId: "call",
				occurredAt: 0,
				severity: "medium",
				confidence: 1.4,
				channel: "call",
				entityRefs: [],
				summary: "invalid",
				payload: { excerpt: "now" },
			}),
		).toThrow(/confidence/)
	})
})
