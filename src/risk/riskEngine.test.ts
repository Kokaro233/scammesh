import { describe, expect, it } from "vitest"
import { createScamSession } from "../runtime/createScamSession"
import { createScamEvent, EVENT_TYPES, type SemanticEventType } from "../runtime/events"
import { createInitialSessionState } from "../runtime/sessionState"
import { loadScenario } from "../scenarios/loadScenario"
import type { Channel, ScamEvent } from "../shared/types"
import { applyRiskToSession, assessRisk } from "./riskEngine"
import { BASE_EVENT_WEIGHTS } from "./weights"

function wait(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

function event(type: SemanticEventType, channel: Channel, eventId: string = type): ScamEvent {
	return createScamEvent({
		eventId,
		type,
		producerId: channel === "identity" ? "identity" : (channel as ScamEvent["producerId"]),
		occurredAt: 1,
		severity: "high",
		confidence: 0.9,
		channel,
		entityRefs: [],
		summary: type,
		payload: { excerpt: type } as ScamEvent["payload"],
	})
}

describe("deterministic risk engine", () => {
	it("keeps a single strong event well below CRITICAL", () => {
		const harvest = assessRisk([event(EVENT_TYPES.CREDENTIAL_HARVESTING_DETECTED, "browser")])
		const remote = assessRisk([event(EVENT_TYPES.REMOTE_CONTROL_DETECTED, "device")])

		expect(harvest.score).toBe(BASE_EVENT_WEIGHTS[EVENT_TYPES.CREDENTIAL_HARVESTING_DETECTED])
		expect(harvest.level).toBe("LOW")
		expect(remote.level).toBe("LOW")
		expect(harvest.reasons).toEqual(["+22 credential harvesting detected"])
	})

	it("raises combined channels more than any single event and explains every point", () => {
		const isolatedMax = Math.max(...Object.values(BASE_EVENT_WEIGHTS))
		const combined = assessRisk([
			event(EVENT_TYPES.COERCION_DETECTED, "call"),
			event(EVENT_TYPES.SUSPICIOUS_LINK_DETECTED, "message"),
			event(EVENT_TYPES.CREDENTIAL_HARVESTING_DETECTED, "browser"),
			event(EVENT_TYPES.DOMAIN_MISMATCH_DETECTED, "browser", "domain"),
			event(EVENT_TYPES.OFFICIAL_IDENTITY_MISMATCH, "identity"),
			event(EVENT_TYPES.REMOTE_CONTROL_DETECTED, "device"),
			event(EVENT_TYPES.NEW_BENEFICIARY_DETECTED, "transaction"),
			event(EVENT_TYPES.HIGH_VALUE_TRANSFER_DETECTED, "transaction", "high"),
			event(EVENT_TYPES.IRREVERSIBLE_PAYMENT_DETECTED, "transaction", "irrev"),
		])

		expect(combined.score).toBeGreaterThan(isolatedMax)
		expect(combined.level).toBe("CRITICAL")
		expect(combined.reasons.some((reason) => reason.includes("synergy: coercion + suspicious link"))).toBe(true)
		expect(combined.reasons.some((reason) => reason.includes("channel-count bonus"))).toBe(true)
		expect(combined.correlations.some((edge) => edge.fromChannel === "call" && edge.toChannel === "message")).toBe(
			true,
		)
		expect(
			combined.correlations.some((edge) => edge.fromChannel === "message" && edge.toChannel === "browser"),
		).toBe(true)
		expect(
			combined.correlations.some((edge) => edge.fromChannel === "browser" && edge.toChannel === "identity"),
		).toBe(true)
		expect(
			combined.correlations.some((edge) => edge.fromChannel === "device" && edge.toChannel === "transaction"),
		).toBe(true)
		expect(combined.actions.map((action) => action.title)).toEqual([
			"Do not transfer",
			"Verify through official channel",
		])
		expect(JSON.stringify(combined.actions)).not.toMatch(/probability|blocked successfully/i)

		const reasonPoints = combined.reasons.map((reason) => Number(/^([+-]\d+)/.exec(reason)?.[1] ?? 0))
		expect(reasonPoints.reduce((sum, value) => sum + value, 0)).toBeGreaterThanOrEqual(combined.score)
	})

	it("does not take only the largest agent score", () => {
		const combined = assessRisk([
			event(EVENT_TYPES.COERCION_DETECTED, "call"),
			event(EVENT_TYPES.SECRECY_REQUEST_DETECTED, "call"),
			event(EVENT_TYPES.SUSPICIOUS_LINK_DETECTED, "message"),
		])

		expect(combined.score).toBe(
			BASE_EVENT_WEIGHTS[EVENT_TYPES.COERCION_DETECTED] +
				BASE_EVENT_WEIGHTS[EVENT_TYPES.SECRECY_REQUEST_DETECTED] +
				BASE_EVENT_WEIGHTS[EVENT_TYPES.SUSPICIOUS_LINK_DETECTED] +
				15,
		)
	})

	it("keeps the benign bank scenario at LOW or WATCH", async () => {
		const session = createScamSession()
		const scenario = loadScenario("benign-bank")
		session.start()
		for (const feed of scenario.feeds) {
			if (feed.sourceChannel === "message") {
				session.injectMessage(feed.payload)
			} else if (feed.sourceChannel === "browser") {
				session.injectBrowser(feed.payload)
			} else if (feed.sourceChannel === "identity") {
				session.injectIdentity(feed.payload)
			} else if (feed.sourceChannel === "transaction") {
				session.injectTransaction(feed.payload)
			}
		}
		await wait(400)

		const state = session.resolveRuntime().state
		expect(["LOW", "WATCH"]).toContain(state.session.riskLevel)
		expect(state.session.riskLevel).not.toBe("CRITICAL")
		expect(state.session.overallRisk).toBeLessThan(55)
	})

	it("keeps the ambiguous scenario below CRITICAL", async () => {
		const session = createScamSession()
		const scenario = loadScenario("ambiguous")
		session.start()
		for (const feed of scenario.feeds) {
			if (feed.sourceChannel === "call") {
				session.injectCall(feed.payload)
			} else if (feed.sourceChannel === "message") {
				session.injectMessage(feed.payload)
			} else if (feed.sourceChannel === "browser") {
				session.injectBrowser(feed.payload)
			} else if (feed.sourceChannel === "identity") {
				session.injectIdentity(feed.payload)
			} else if (feed.sourceChannel === "transaction") {
				session.injectTransaction(feed.payload)
			}
		}
		await wait(450)

		expect(session.resolveRuntime().state.session.riskLevel).not.toBe("CRITICAL")
	})

	it("records a cross-channel pattern only after a CRITICAL multi-channel fusion", () => {
		const session = createInitialSessionState()
		session.events = [
			event(EVENT_TYPES.COERCION_DETECTED, "call"),
			event(EVENT_TYPES.SUSPICIOUS_LINK_DETECTED, "message"),
			event(EVENT_TYPES.CREDENTIAL_HARVESTING_DETECTED, "browser"),
			event(EVENT_TYPES.REMOTE_CONTROL_DETECTED, "device"),
			event(EVENT_TYPES.NEW_BENEFICIARY_DETECTED, "transaction"),
			event(EVENT_TYPES.OFFICIAL_IDENTITY_MISMATCH, "identity"),
		]
		applyRiskToSession(session, "combo")
		expect(session.events.some((item) => item.type === EVENT_TYPES.CROSS_CHANNEL_PATTERN_DETECTED)).toBe(true)

		const lonely = createInitialSessionState()
		lonely.events = [event(EVENT_TYPES.CREDENTIAL_HARVESTING_DETECTED, "browser")]
		applyRiskToSession(lonely, "solo")
		expect(lonely.events.some((item) => item.type === EVENT_TYPES.CROSS_CHANNEL_PATTERN_DETECTED)).toBe(false)
	})
})
