import type { Scenario } from "../shared/types"
import { APEX_TRUSTED_REGISTRY } from "./trustedRegistry"

export const benignBankScenario: Scenario = {
	id: "benign-bank",
	title: "Official Apex Bank transfer",
	summary:
		"The user sends RM 300 from the official Apex Bank app to a known payee and receives an official activity SMS.",
	trustedRegistry: APEX_TRUSTED_REGISTRY,
	feeds: [
		{
			feedId: "tx-known-payee",
			timestampOffsetMs: 0,
			sourceChannel: "transaction",
			payload: {
				amount: 300,
				currency: "MYR",
				beneficiaryName: "Lee Wei Ming",
				beneficiaryAccount: "1122334455",
				isNewBeneficiary: false,
				paymentRail: "DuitNow",
				reversible: false,
			},
		},
		{
			feedId: "identity-known-payee",
			timestampOffsetMs: 200,
			sourceChannel: "identity",
			payload: {
				kind: "beneficiary",
				value: "1122334455",
				claimedOrganization: "Lee Wei Ming",
			},
		},
		{
			feedId: "sms-official-activity",
			timestampOffsetMs: 2_000,
			sourceChannel: "message",
			payload: {
				messageId: "sms-activity-001",
				transport: "sms",
				sender: "+60320002000",
				body: "Apex Bank: You sent RM 300 to Lee Wei Ming. View activity: https://secure.apexbank.com.my/activity",
				links: [{ url: "https://secure.apexbank.com.my/activity", displayText: "secure.apexbank.com.my" }],
			},
		},
		{
			feedId: "identity-official-phone",
			timestampOffsetMs: 2_200,
			sourceChannel: "identity",
			payload: {
				kind: "phone",
				value: "+60320002000",
				claimedOrganization: "Apex Bank",
			},
		},
		{
			feedId: "identity-official-domain",
			timestampOffsetMs: 2_400,
			sourceChannel: "identity",
			payload: {
				kind: "domain",
				value: "secure.apexbank.com.my",
				claimedOrganization: "Apex Bank",
			},
		},
		{
			feedId: "browser-official-activity",
			timestampOffsetMs: 4_000,
			sourceChannel: "browser",
			payload: {
				url: "https://secure.apexbank.com.my/activity",
				hostname: "secure.apexbank.com.my",
				title: "Apex Bank | Recent activity",
				pageText: "Transfer of RM 300 to Lee Wei Ming is complete. No additional verification is required.",
				claimedBrand: "Apex Bank",
				formFields: [],
			},
		},
	],
}
