import { describe, expect, it } from "vitest"
import { loopsOverlap } from "../runtime/createScamEnvironment"
import { createScamSession } from "../runtime/createScamSession"
import { EVENT_TYPES } from "../runtime/events"
import { loadScenario } from "../scenarios/loadScenario"

function wait(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

function mainTransfer() {
	const feed = loadScenario("bank-impersonation").feeds.find((item) => item.feedId === "transaction-safe-account")
	if (!feed || feed.sourceChannel !== "transaction") {
		throw new Error("expected main transfer")
	}
	return feed.payload
}

function mainRemoteControl() {
	const feed = loadScenario("bank-impersonation").feeds.find((item) => item.feedId === "device-remote")
	if (!feed || feed.sourceChannel !== "device") {
		throw new Error("expected remote-control telemetry")
	}
	return feed.payload
}

function mainScreenShare() {
	const feed = loadScenario("bank-impersonation").feeds.find((item) => item.feedId === "device-screen-share")
	if (!feed || feed.sourceChannel !== "device") {
		throw new Error("expected screen-share telemetry")
	}
	return feed.payload
}

function mainBeneficiaryLookup() {
	const feed = loadScenario("bank-impersonation").feeds.find((item) => item.feedId === "identity-beneficiary")
	if (!feed || feed.sourceChannel !== "identity") {
		throw new Error("expected beneficiary lookup")
	}
	return feed.payload
}

describe("Device Agent and Transaction Agent", () => {
	it("keeps the same transfer narrow until Device or Identity adapts it", async () => {
		const session = createScamSession()
		session.start()
		session.injectTransaction(mainTransfer())
		session.injectDevice({ kind: "accessibility_enabled" })
		await wait(320)

		const state = session.resolveRuntime().state
		expect(state.session.agentModes.transaction).toBe("NORMAL")
		expect(state.session.events.some((event) => event.type === EVENT_TYPES.NEW_BENEFICIARY_DETECTED)).toBe(true)
		expect(state.session.events.some((event) => event.type === EVENT_TYPES.HIGH_VALUE_TRANSFER_DETECTED)).toBe(
			false,
		)
		expect(state.session.events.some((event) => event.type === EVENT_TYPES.IRREVERSIBLE_PAYMENT_DETECTED)).toBe(
			false,
		)
		expect(state.session.recommendedActions).toEqual([])
		expect(state.deviceTelemetry.some((item) => item.kind === "accessibility_enabled")).toBe(true)
	})

	it("lets remote control and beneficiary mismatch raise the same transfer", async () => {
		const session = createScamSession()
		session.start()
		session.injectTransaction(mainTransfer())
		session.injectDevice(mainScreenShare())
		session.injectDevice(mainRemoteControl())
		await wait(320)
		session.injectIdentity(mainBeneficiaryLookup())
		await wait(320)

		const state = session.resolveRuntime().state
		expect(loopsOverlap(state.loops.device, state.loops.transaction)).toBe(true)
		expect(
			state.session.adaptations.find(
				(item) => item.sourceAgent === "device" && item.targetAgent === "transaction",
			),
		).toMatchObject({
			triggerEvent: EVENT_TYPES.REMOTE_CONTROL_DETECTED,
			beforeMode: "NORMAL",
			afterMode: "HEIGHTENED",
		})
		expect(
			state.session.adaptations.find(
				(item) => item.sourceAgent === "identity" && item.targetAgent === "transaction",
			),
		).toMatchObject({
			triggerEvent: EVENT_TYPES.OFFICIAL_IDENTITY_MISMATCH,
			afterMode: "PRIORITY",
		})
		expect(state.session.agentModes.transaction).toBe("PRIORITY")
		expect(state.session.events.some((event) => event.type === EVENT_TYPES.SCREEN_SHARE_ENABLED)).toBe(true)
		expect(state.session.events.some((event) => event.type === EVENT_TYPES.REMOTE_CONTROL_DETECTED)).toBe(true)
		expect(state.session.events.some((event) => event.type === EVENT_TYPES.NEW_BENEFICIARY_DETECTED)).toBe(true)
		expect(state.session.events.some((event) => event.type === EVENT_TYPES.HIGH_VALUE_TRANSFER_DETECTED)).toBe(true)
		expect(state.session.events.some((event) => event.type === EVENT_TYPES.IRREVERSIBLE_PAYMENT_DETECTED)).toBe(
			true,
		)
		expect(state.identityMismatches.some((item) => item.kind === "beneficiary")).toBe(true)
		expect(
			state.session.recommendedActions.some(
				(action) =>
					action.title === "Prototype recommendation: STOP TRANSFER" || action.title === "Do not transfer",
			),
		).toBe(true)
		expect(
			state.session.recommendedActions.some((action) => action.title === "Verify through official channel"),
		).toBe(true)
		expect(JSON.stringify(state.session.recommendedActions)).not.toContain("blocked successfully")
		expect(state.session.riskLevel).toBe("CRITICAL")
		expect(state.session.overallRisk).toBeGreaterThanOrEqual(75)
		expect(state.session.riskSnapshots.at(-1)?.reasons.some((reason) => reason.includes("synergy"))).toBe(true)

		const devicePayloads = state.analyzeLog
			.filter((entry) => entry.agentId === "device")
			.map((entry) => entry.payload)
		const transactionPayloads = state.analyzeLog
			.filter((entry) => entry.agentId === "transaction")
			.map((entry) => entry.payload)
		expect(
			devicePayloads.every(
				(payload) =>
					payload &&
					typeof payload === "object" &&
					"kind" in payload &&
					!("beneficiaryAccount" in payload) &&
					!("speaker" in payload),
			),
		).toBe(true)
		expect(
			transactionPayloads.every(
				(payload) =>
					payload &&
					typeof payload === "object" &&
					"beneficiaryAccount" in payload &&
					"amount" in payload &&
					!("appName" in payload) &&
					!("formFields" in payload),
			),
		).toBe(true)
		expect(JSON.stringify(devicePayloads)).not.toContain("8000")
		expect(JSON.stringify(transactionPayloads)).not.toContain("AnyDesk")
	})
})
