import type { Scenario } from "../shared/types"
import { APEX_TRUSTED_REGISTRY } from "./trustedRegistry"

export const ambiguousScenario: Scenario = {
	id: "ambiguous",
	title: "Unknown caller plus official banking activity",
	summary:
		"An unknown number asks the user to confirm a payment quickly, while the official Apex channel shows a normal small transfer.",
	trustedRegistry: APEX_TRUSTED_REGISTRY,
	feeds: [
		{
			feedId: "call-unknown",
			timestampOffsetMs: 0,
			sourceChannel: "call",
			payload: {
				speaker: "caller",
				text: "Hi, this is about a pending payment on your account. Please confirm it quickly so we can finish processing.",
			},
		},
		{
			feedId: "identity-unknown-phone",
			timestampOffsetMs: 400,
			sourceChannel: "identity",
			payload: {
				kind: "phone",
				value: "+60118881234",
			},
		},
		{
			feedId: "call-user",
			timestampOffsetMs: 2_000,
			sourceChannel: "call",
			payload: {
				speaker: "user",
				text: "I already used the Apex Bank app. I will check the official message.",
			},
		},
		{
			feedId: "sms-official-login",
			timestampOffsetMs: 3_000,
			sourceChannel: "message",
			payload: {
				messageId: "sms-login-001",
				transport: "sms",
				sender: "+60320002000",
				body: "Apex Bank: Your login from the Apex Bank app was successful. https://secure.apexbank.com.my/security",
				links: [{ url: "https://secure.apexbank.com.my/security", displayText: "secure.apexbank.com.my" }],
			},
		},
		{
			feedId: "identity-official-domain",
			timestampOffsetMs: 3_200,
			sourceChannel: "identity",
			payload: {
				kind: "domain",
				value: "secure.apexbank.com.my",
				claimedOrganization: "Apex Bank",
			},
		},
		{
			feedId: "browser-official-security",
			timestampOffsetMs: 4_500,
			sourceChannel: "browser",
			payload: {
				url: "https://secure.apexbank.com.my/security",
				hostname: "secure.apexbank.com.my",
				title: "Apex Bank | Security alert",
				pageText: "A login from the official Apex Bank app succeeded. No password or OTP is requested here.",
				claimedBrand: "Apex Bank",
				formFields: [],
			},
		},
		{
			feedId: "tx-small-known",
			timestampOffsetMs: 6_000,
			sourceChannel: "transaction",
			payload: {
				amount: 80,
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
			timestampOffsetMs: 6_200,
			sourceChannel: "identity",
			payload: {
				kind: "beneficiary",
				value: "1122334455",
				claimedOrganization: "Lee Wei Ming",
			},
		},
	],
}
