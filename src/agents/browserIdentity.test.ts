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

function mainClonePage() {
	const feed = loadScenario("bank-impersonation").feeds.find((item) => item.feedId === "browser-clone")
	if (!feed || feed.sourceChannel !== "browser") {
		throw new Error("expected clone page")
	}
	return feed.payload
}

describe("Browser Agent and Identity Agent", () => {
	it("does not harvest credentials until Message emits a suspicious link", async () => {
		const session = createScamSession()
		session.start()
		session.injectBrowser(mainClonePage())
		await wait(280)

		const state = session.resolveRuntime().state
		expect(state.session.agentModes.browser).toBe("NORMAL")
		expect(state.session.adaptations.some((item) => item.targetAgent === "browser")).toBe(false)
		expect(state.session.events.some((event) => event.type === EVENT_TYPES.CREDENTIAL_HARVESTING_DETECTED)).toBe(
			false,
		)
		expect(state.session.events.some((event) => event.type === EVENT_TYPES.DOMAIN_MISMATCH_DETECTED)).toBe(true)
	})

	it("lets the same SMS raise Browser to PRIORITY and Identity check the claimed bank domain", async () => {
		const session = createScamSession()
		session.start()
		session.injectBrowser(mainClonePage())
		session.injectMessage(mainSms())
		session.injectCall(mainCallCoercion())
		await wait(520)

		const state = session.resolveRuntime().state
		expect(loopsOverlap(state.loops.message, state.loops.browser)).toBe(true)
		expect(
			state.session.adaptations.find((item) => item.sourceAgent === "message" && item.targetAgent === "browser"),
		).toMatchObject({
			sourceAgent: "message",
			targetAgent: "browser",
			triggerEvent: EVENT_TYPES.SUSPICIOUS_LINK_DETECTED,
			beforeMode: "NORMAL",
			afterMode: "PRIORITY",
		})
		expect(state.session.agentModes.browser).toBe("PRIORITY")
		expect(state.session.events.some((event) => event.type === EVENT_TYPES.SUSPICIOUS_LINK_DETECTED)).toBe(true)
		expect(state.session.events.some((event) => event.type === EVENT_TYPES.CREDENTIAL_HARVESTING_DETECTED)).toBe(
			true,
		)
		expect(state.session.events.some((event) => event.type === EVENT_TYPES.OFFICIAL_IDENTITY_MISMATCH)).toBe(true)
		expect(state.identityMismatches.some((item) => item.kind === "domain")).toBe(true)
		expect(state.session.overallRisk).toBe(0)
		expect(state.session.riskLevel).toBe("LOW")

		const domain = Object.values(state.session.entities).find(
			(entity) => entity.kind === "domain" && entity.value.includes("secure-bank-verify"),
		)
		const bank = Object.values(state.session.entities).find(
			(entity) => entity.kind === "bank" && /apex/i.test(entity.value),
		)
		expect(domain?.channelRefs).toEqual(expect.arrayContaining(["message", "browser", "identity"]))
		expect(bank?.channelRefs).toEqual(expect.arrayContaining(["browser", "identity"]))

		const browserPayloads = state.analyzeLog
			.filter((entry) => entry.agentId === "browser")
			.map((entry) => entry.payload)
		const identityPayloads = state.analyzeLog
			.filter((entry) => entry.agentId === "identity")
			.map((entry) => entry.payload)
		expect(
			browserPayloads.every(
				(payload) =>
					payload &&
					typeof payload === "object" &&
					"hostname" in payload &&
					"formFields" in payload &&
					!("speaker" in payload) &&
					!("links" in payload),
			),
		).toBe(true)
		expect(
			identityPayloads.every(
				(payload) =>
					payload &&
					typeof payload === "object" &&
					"kind" in payload &&
					"value" in payload &&
					!("formFields" in payload) &&
					!("pageText" in payload),
			),
		).toBe(true)
		expect(JSON.stringify(browserPayloads)).not.toContain("Do not hang up")
		expect(JSON.stringify(identityPayloads)).not.toContain("debit card number")
	})

	it("uses the local registry mock and does not invent an official domain", async () => {
		const session = createScamSession()
		session.start()
		session.injectIdentity({
			kind: "domain",
			value: "secure.apexbank.com.my",
			claimedOrganization: "Apex Bank",
		})
		await wait(280)

		const state = session.resolveRuntime().state
		expect(state.registry.officialBankDomains).toContain("secure.apexbank.com.my")
		expect(state.session.events.some((event) => event.type === EVENT_TYPES.OFFICIAL_IDENTITY_MISMATCH)).toBe(false)
		expect(state.analyzeLog.some((entry) => entry.agentId === "identity")).toBe(true)
		expect(
			state.analyzeLog.every(
				(entry) => entry.agentId !== "identity" || !("pageText" in (entry.payload as object)),
			),
		).toBe(true)
	})
})
