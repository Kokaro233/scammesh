import { describe, expect, it } from "vitest"
import { ANALYSIS_SCHEMA } from "../inference/schema"
import { MockInferenceProvider } from "../inference/mockProvider"
import { EVENT_TYPES } from "../runtime/events"
import type { IdentityLookup } from "../shared/types"
import { APEX_TRUSTED_REGISTRY } from "./trustedRegistry"

const mock = new MockInferenceProvider()

async function lookup(payload: IdentityLookup) {
	return mock.analyze({ channel: "identity", payload }, ANALYSIS_SCHEMA, {
		agentId: "identity",
		channel: "identity",
		mode: "NORMAL",
		registry: APEX_TRUSTED_REGISTRY,
	})
}

describe("trusted registry lookup", () => {
	it("keeps official Apex phone, domain, and payee off the mismatch list", async () => {
		const phone = await lookup({ kind: "phone", value: APEX_TRUSTED_REGISTRY.officialPhoneNumbers[0] })
		const domain = await lookup({ kind: "domain", value: APEX_TRUSTED_REGISTRY.officialBankDomains[1] })
		const payee = await lookup({ kind: "beneficiary", value: APEX_TRUSTED_REGISTRY.knownPayees[0].account })

		expect(phone.detections).toEqual([])
		expect(domain.detections).toEqual([])
		expect(payee.detections).toEqual([])
	})

	it("flags the main-scenario clones that are not in the registry", async () => {
		const phone = await lookup({
			kind: "phone",
			value: "+60119000000",
			claimedOrganization: "Apex Bank",
		})
		const domain = await lookup({
			kind: "domain",
			value: "secure-bank-verify.example",
			claimedOrganization: "Apex Bank",
		})
		const payee = await lookup({
			kind: "beneficiary",
			value: "9901882233",
			claimedOrganization: "Apex Safe Holding",
		})

		expect(phone.detections.some((item) => item.type === EVENT_TYPES.OFFICIAL_IDENTITY_MISMATCH)).toBe(true)
		expect(domain.detections.some((item) => item.type === EVENT_TYPES.OFFICIAL_IDENTITY_MISMATCH)).toBe(true)
		expect(payee.detections.some((item) => item.type === EVENT_TYPES.OFFICIAL_IDENTITY_MISMATCH)).toBe(true)
	})
})
