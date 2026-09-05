import { EVENT_TYPES, type SemanticEventType } from "../runtime/events"
import type { Channel, RiskLevel } from "../shared/types"

export const BASE_EVENT_WEIGHTS: Record<SemanticEventType, number> = {
	[EVENT_TYPES.IMPERSONATION_CLAIMED]: 10,
	[EVENT_TYPES.OFFICIAL_IDENTITY_MISMATCH]: 22,
	[EVENT_TYPES.UNVERIFIED_CONTACT_DETECTED]: 8,
	[EVENT_TYPES.COERCION_DETECTED]: 12,
	[EVENT_TYPES.SECRECY_REQUEST_DETECTED]: 8,
	[EVENT_TYPES.URGENCY_DETECTED]: 8,
	[EVENT_TYPES.SUSPICIOUS_LINK_DETECTED]: 14,
	[EVENT_TYPES.DOMAIN_MISMATCH_DETECTED]: 18,
	[EVENT_TYPES.CREDENTIAL_HARVESTING_DETECTED]: 22,
	[EVENT_TYPES.OTP_REQUEST_DETECTED]: 10,
	[EVENT_TYPES.REMOTE_CONTROL_DETECTED]: 20,
	[EVENT_TYPES.SCREEN_SHARE_ENABLED]: 8,
	[EVENT_TYPES.NEW_BENEFICIARY_DETECTED]: 10,
	[EVENT_TYPES.HIGH_VALUE_TRANSFER_DETECTED]: 12,
	[EVENT_TYPES.IRREVERSIBLE_PAYMENT_DETECTED]: 12,
	[EVENT_TYPES.AGENT_RISK_ESCALATED]: 0,
	[EVENT_TYPES.CORRELATION_FOUND]: 0,
	[EVENT_TYPES.CROSS_CHANNEL_PATTERN_DETECTED]: 0,
	[EVENT_TYPES.HUMAN_WARNING_ISSUED]: 0,
	[EVENT_TYPES.AGENT_ERROR]: 0,
	[EVENT_TYPES.PROVIDER_ERROR]: 0,
}

export interface SynergyRule {
	id: string
	types: SemanticEventType[]
	bonus: number
	reason: string
	fromChannel: Channel
	toChannel: Channel
	label: string
}

export const SYNERGY_RULES: SynergyRule[] = [
	{
		id: "coercion-suspicious-link",
		types: [EVENT_TYPES.COERCION_DETECTED, EVENT_TYPES.SUSPICIOUS_LINK_DETECTED],
		bonus: 15,
		reason: "+15 synergy: coercion + suspicious link",
		fromChannel: "call",
		toChannel: "message",
		label: "call coercion to SMS link",
	},
	{
		id: "link-otp-page",
		types: [EVENT_TYPES.SUSPICIOUS_LINK_DETECTED, EVENT_TYPES.CREDENTIAL_HARVESTING_DETECTED],
		bonus: 20,
		reason: "+20 synergy: suspicious link + OTP page",
		fromChannel: "message",
		toChannel: "browser",
		label: "SMS link to credential harvesting",
	},
	{
		id: "browser-identity-domain",
		types: [EVENT_TYPES.DOMAIN_MISMATCH_DETECTED, EVENT_TYPES.OFFICIAL_IDENTITY_MISMATCH],
		bonus: 0,
		reason: "",
		fromChannel: "browser",
		toChannel: "identity",
		label: "clone page to identity mismatch",
	},
	{
		id: "remote-new-beneficiary",
		types: [EVENT_TYPES.REMOTE_CONTROL_DETECTED, EVENT_TYPES.NEW_BENEFICIARY_DETECTED],
		bonus: 20,
		reason: "+20 synergy: remote control + new beneficiary",
		fromChannel: "device",
		toChannel: "transaction",
		label: "remote control to new beneficiary",
	},
	{
		id: "identity-irreversible-transfer",
		types: [
			EVENT_TYPES.OFFICIAL_IDENTITY_MISMATCH,
			EVENT_TYPES.HIGH_VALUE_TRANSFER_DETECTED,
			EVENT_TYPES.IRREVERSIBLE_PAYMENT_DETECTED,
		],
		bonus: 18,
		reason: "+18 synergy: identity mismatch + high-value irreversible transfer",
		fromChannel: "identity",
		toChannel: "transaction",
		label: "identity mismatch to payment",
	},
]

export const CHANNEL_COUNT_BONUS = 15
export const CHANNEL_COUNT_THRESHOLD = 4

export const RISK_LEVEL_BANDS: Array<{ max: number; level: RiskLevel }> = [
	{ max: 29, level: "LOW" },
	{ max: 54, level: "WATCH" },
	{ max: 74, level: "HIGH" },
	{ max: 100, level: "CRITICAL" },
]

export function levelForScore(score: number): RiskLevel {
	const clamped = Math.max(0, Math.min(100, score))
	return RISK_LEVEL_BANDS.find((band) => clamped <= band.max)?.level ?? "CRITICAL"
}

export function labelForEventType(type: SemanticEventType) {
	return type.replace(/_/g, " ")
}
