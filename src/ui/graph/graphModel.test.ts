import { describe, expect, it } from "vitest"
import { EVENT_TYPES } from "../../runtime/events"
import { createInitialSessionState } from "../../runtime/sessionState"
import type { CorrelationEdge, ScamEvent } from "../../shared/types"
import { buildScamGraph } from "./graphModel"

function edge(fromChannel: CorrelationEdge["fromChannel"], toChannel: CorrelationEdge["toChannel"], label: string) {
	return {
		edgeId: `edge-${fromChannel}-${toChannel}`,
		fromEventId: `${fromChannel}-1`,
		toEventId: `${toChannel}-1`,
		label,
		fromChannel,
		toChannel,
	} satisfies CorrelationEdge
}

describe("scam graph model", () => {
	it("keeps nodes isolated until a real correlation exists", () => {
		const session = createInitialSessionState()
		session.events.push({
			eventId: "solo",
			type: EVENT_TYPES.URGENCY_DETECTED,
			producerId: "call",
			occurredAt: 1,
			severity: "medium",
			confidence: 0.8,
			channel: "call",
			entityRefs: [],
			summary: "urgency",
			payload: { excerpt: "quickly" },
		} as ScamEvent)

		const graph = buildScamGraph(session)
		expect(graph.edges).toEqual([])
		expect(graph.highlightChain).toBe(false)
		expect(graph.nodes.find((node) => node.id === "call")?.active).toBe(true)
		expect(graph.nodes.find((node) => node.id === "message")?.active).toBe(false)
	})

	it("draws edges only from correlation rules and highlights the finished chain", () => {
		const session = createInitialSessionState()
		session.correlations = [
			edge("call", "message", "link opened"),
			edge("message", "browser", "OTP requested"),
			edge("browser", "identity", "same claimed bank"),
			edge("device", "transaction", "new beneficiary"),
			edge("identity", "transaction", "identity mismatch"),
		]
		session.events = [
			{
				eventId: "pattern-cross-channel",
				type: EVENT_TYPES.CROSS_CHANNEL_PATTERN_DETECTED,
				producerId: "identity",
				occurredAt: 2,
				severity: "critical",
				confidence: 1,
				channel: "identity",
				entityRefs: ["call", "message"],
				summary: "pattern",
				payload: { correlationKey: "scam_case_001", channels: ["call", "message"] },
			} as ScamEvent,
		]

		const graph = buildScamGraph(session)
		expect(graph.edges.map((item) => item.label)).toEqual([
			"link opened",
			"OTP requested",
			"same claimed bank",
			"new beneficiary",
			"identity mismatch",
		])
		expect(graph.edges.every((item) => item.from !== item.to)).toBe(true)
		expect(graph.highlightChain).toBe(true)
	})
})
