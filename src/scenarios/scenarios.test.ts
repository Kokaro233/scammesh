import { describe, expect, it } from "vitest"
import { CHANNELS, SCENARIO_IDS } from "../shared/types"
import { channelsCovered, forbiddenJudgementTokensIn, loadAllScenarios, loadScenario } from "./loadScenario"

describe("scenario contracts", () => {
	it("loads three scenarios with pure functions", () => {
		const loaded = loadAllScenarios()
		expect(loaded.map((scenario) => scenario.id)).toEqual([...SCENARIO_IDS])
		expect(loadScenario("bank-impersonation").id).toBe("bank-impersonation")
		expect(loadScenario("benign-bank").id).toBe("benign-bank")
		expect(loadScenario("ambiguous").id).toBe("ambiguous")
	})

	it("gives the main scenario enough feeds for all six agents", () => {
		const main = loadScenario("bank-impersonation")
		expect(channelsCovered(main)).toEqual([...CHANNELS])
		expect(main.feeds.every((feed) => typeof feed.timestampOffsetMs === "number")).toBe(true)
		expect(main.feeds.every((feed) => feed.payload)).toBeTruthy()
	})

	it("does not bake in scores or a finished cross-channel verdict", () => {
		for (const scenario of loadAllScenarios()) {
			expect(forbiddenJudgementTokensIn(scenario)).toEqual([])
			expect(scenario.feeds.map((feed) => feed.timestampOffsetMs)).toEqual(
				[...scenario.feeds].map((feed) => feed.timestampOffsetMs).sort((left, right) => left - right),
			)
		}
	})

	it("keeps the main story inputs distinct across channels", () => {
		const main = loadScenario("bank-impersonation")
		const serialized = JSON.stringify(main)

		expect(serialized).toContain("Do not hang up")
		expect(serialized).toContain("secure-bank-verify.example")
		expect(serialized).toContain("AnyDesk")
		expect(serialized).toContain("8000")
		expect(serialized).toContain("+60119000000")
	})

	it("keeps the benign path official and small", () => {
		const benign = loadScenario("benign-bank")
		const serialized = JSON.stringify(benign)

		expect(serialized).toContain("300")
		expect(serialized).toContain("Lee Wei Ming")
		expect(serialized).toContain("secure.apexbank.com.my")
		expect(serialized).not.toContain("secure-bank-verify.example")
		expect(serialized).not.toContain("AnyDesk")
		expect(benign.feeds.some((feed) => feed.sourceChannel === "call")).toBe(false)
	})

	it("keeps the ambiguous path mixed but incomplete", () => {
		const ambiguous = loadScenario("ambiguous")
		const serialized = JSON.stringify(ambiguous)

		expect(serialized).toContain("+60118881234")
		expect(serialized).toContain("secure.apexbank.com.my")
		expect(serialized).toContain("80")
		expect(serialized).not.toContain("AnyDesk")
		expect(serialized).not.toContain("secure-bank-verify.example")
	})
})
