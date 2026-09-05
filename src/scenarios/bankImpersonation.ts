import type { Scenario } from "../shared/types"
import { APEX_TRUSTED_REGISTRY } from "./trustedRegistry"

export const bankImpersonationScenario: Scenario = {
	id: "bank-impersonation",
	title: "Apex Bank impersonation",
	summary:
		"A caller claims to be Apex Bank anti-fraud, a SMS link opens a clone page, screen sharing starts, then a new RM 8,000 transfer is requested.",
	trustedRegistry: APEX_TRUSTED_REGISTRY,
	feeds: [
		{
			feedId: "call-open",
			timestampOffsetMs: 0,
			sourceChannel: "call",
			payload: {
				speaker: "caller",
				text: "This is Apex Bank Anti-Fraud Centre. We detected unusual activity on your account.",
				claimedIdentity: "Apex Bank Anti-Fraud Centre",
			},
		},
		{
			feedId: "identity-phone",
			timestampOffsetMs: 1_500,
			sourceChannel: "identity",
			payload: {
				kind: "phone",
				value: "+60119000000",
				claimedOrganization: "Apex Bank",
			},
		},
		{
			feedId: "call-coercion",
			timestampOffsetMs: 4_000,
			sourceChannel: "call",
			payload: {
				speaker: "caller",
				text: "Your account is linked to a money-laundering case. Do not hang up. Stay on the line or the account will be frozen.",
				claimedIdentity: "Apex Bank Anti-Fraud Centre",
			},
		},
		{
			feedId: "call-user-ack",
			timestampOffsetMs: 6_000,
			sourceChannel: "call",
			payload: {
				speaker: "user",
				text: "I did not make any unusual transfer. Who is calling?",
			},
		},
		{
			feedId: "call-secrecy",
			timestampOffsetMs: 8_000,
			sourceChannel: "call",
			payload: {
				speaker: "caller",
				text: "Do not tell anyone, including family. This case is confidential. If you hang up we cannot protect the funds.",
			},
		},
		{
			feedId: "message-verify",
			timestampOffsetMs: 12_000,
			sourceChannel: "message",
			payload: {
				messageId: "sms-verify-001",
				transport: "sms",
				sender: "+60119000000",
				body: "Apex Bank: Verify your account immediately: https://secure-bank-verify.example/login",
				links: [{ url: "https://secure-bank-verify.example/login", displayText: "secure-bank-verify.example" }],
			},
		},
		{
			feedId: "identity-domain",
			timestampOffsetMs: 12_500,
			sourceChannel: "identity",
			payload: {
				kind: "domain",
				value: "secure-bank-verify.example",
				claimedOrganization: "Apex Bank",
			},
		},
		{
			feedId: "call-open-sms",
			timestampOffsetMs: 14_000,
			sourceChannel: "call",
			payload: {
				speaker: "caller",
				text: "Open the SMS now. Enter your card number and the OTP on the secure page so we can lock the account.",
			},
		},
		{
			feedId: "browser-clone",
			timestampOffsetMs: 16_000,
			sourceChannel: "browser",
			payload: {
				url: "https://secure-bank-verify.example/login",
				hostname: "secure-bank-verify.example",
				title: "Apex Bank | Secure account verification",
				pageText:
					"Apex Bank official verification. Enter your debit card number and one-time password to keep your account safe.",
				claimedBrand: "Apex Bank",
				formFields: [
					{ name: "cardNumber", fieldType: "tel", requestsSecret: "card" },
					{ name: "otp", fieldType: "password", requestsSecret: "otp" },
				],
			},
		},
		{
			feedId: "device-screen-share",
			timestampOffsetMs: 20_000,
			sourceChannel: "device",
			payload: {
				kind: "screen_share_enabled",
				appName: "Zoom",
			},
		},
		{
			feedId: "call-screen-share",
			timestampOffsetMs: 21_000,
			sourceChannel: "call",
			payload: {
				speaker: "caller",
				text: "Share your screen so I can guide you. Then transfer RM 8,000 to the holding safe account we just created.",
			},
		},
		{
			feedId: "device-remote",
			timestampOffsetMs: 24_000,
			sourceChannel: "device",
			payload: {
				kind: "remote_control_app_opened",
				appName: "AnyDesk",
			},
		},
		{
			feedId: "transaction-safe-account",
			timestampOffsetMs: 28_000,
			sourceChannel: "transaction",
			payload: {
				amount: 8000,
				currency: "MYR",
				beneficiaryName: "Apex Safe Holding",
				beneficiaryAccount: "9901882233",
				isNewBeneficiary: true,
				paymentRail: "DuitNow",
				reversible: false,
			},
		},
		{
			feedId: "identity-beneficiary",
			timestampOffsetMs: 28_500,
			sourceChannel: "identity",
			payload: {
				kind: "beneficiary",
				value: "9901882233",
				claimedOrganization: "Apex Safe Holding",
			},
		},
	],
}
