import type { AgentId, Channel, CheckMode, ScamEvent, Severity } from "../shared/types"

export const EVENT_TYPES = {
	IMPERSONATION_CLAIMED: "impersonation_claimed",
	OFFICIAL_IDENTITY_MISMATCH: "official_identity_mismatch",
	UNVERIFIED_CONTACT_DETECTED: "unverified_contact_detected",
	COERCION_DETECTED: "coercion_detected",
	SECRECY_REQUEST_DETECTED: "secrecy_request_detected",
	URGENCY_DETECTED: "urgency_detected",
	SUSPICIOUS_LINK_DETECTED: "suspicious_link_detected",
	DOMAIN_MISMATCH_DETECTED: "domain_mismatch_detected",
	CREDENTIAL_HARVESTING_DETECTED: "credential_harvesting_detected",
	OTP_REQUEST_DETECTED: "otp_request_detected",
	REMOTE_CONTROL_DETECTED: "remote_control_detected",
	SCREEN_SHARE_ENABLED: "screen_share_enabled",
	NEW_BENEFICIARY_DETECTED: "new_beneficiary_detected",
	HIGH_VALUE_TRANSFER_DETECTED: "high_value_transfer_detected",
	IRREVERSIBLE_PAYMENT_DETECTED: "irreversible_payment_detected",
	AGENT_RISK_ESCALATED: "agent_risk_escalated",
	CORRELATION_FOUND: "correlation_found",
	CROSS_CHANNEL_PATTERN_DETECTED: "cross_channel_pattern_detected",
	HUMAN_WARNING_ISSUED: "human_warning_issued",
	AGENT_ERROR: "agent_error",
	PROVIDER_ERROR: "provider_error",
} as const

export type SemanticEventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES]

export const EVENT_TYPE_VALUES = Object.values(EVENT_TYPES)

export const EVENT_CATEGORIES = {
	identity: [
		EVENT_TYPES.IMPERSONATION_CLAIMED,
		EVENT_TYPES.OFFICIAL_IDENTITY_MISMATCH,
		EVENT_TYPES.UNVERIFIED_CONTACT_DETECTED,
	],
	socialEngineering: [
		EVENT_TYPES.COERCION_DETECTED,
		EVENT_TYPES.SECRECY_REQUEST_DETECTED,
		EVENT_TYPES.URGENCY_DETECTED,
	],
	credential: [
		EVENT_TYPES.SUSPICIOUS_LINK_DETECTED,
		EVENT_TYPES.DOMAIN_MISMATCH_DETECTED,
		EVENT_TYPES.CREDENTIAL_HARVESTING_DETECTED,
		EVENT_TYPES.OTP_REQUEST_DETECTED,
	],
	device: [EVENT_TYPES.REMOTE_CONTROL_DETECTED, EVENT_TYPES.SCREEN_SHARE_ENABLED],
	payment: [
		EVENT_TYPES.NEW_BENEFICIARY_DETECTED,
		EVENT_TYPES.HIGH_VALUE_TRANSFER_DETECTED,
		EVENT_TYPES.IRREVERSIBLE_PAYMENT_DETECTED,
	],
	coordination: [
		EVENT_TYPES.AGENT_RISK_ESCALATED,
		EVENT_TYPES.CORRELATION_FOUND,
		EVENT_TYPES.CROSS_CHANNEL_PATTERN_DETECTED,
		EVENT_TYPES.HUMAN_WARNING_ISSUED,
	],
	system: [EVENT_TYPES.AGENT_ERROR, EVENT_TYPES.PROVIDER_ERROR],
} as const

export interface EventPayloadMap {
	impersonation_claimed: { claimedRole: string; claimedOrganization: string }
	official_identity_mismatch: {
		kind: "phone" | "domain" | "beneficiary"
		claimed: string
		officialHint: string
	}
	unverified_contact_detected: { contact: string; contactKind: "phone" | "domain" }
	coercion_detected: { tactic: string; excerpt: string }
	secrecy_request_detected: { excerpt: string }
	urgency_detected: { excerpt: string }
	suspicious_link_detected: { url: string; hostname: string }
	domain_mismatch_detected: { hostname: string; claimedBrand: string }
	credential_harvesting_detected: { requestedSecrets: Array<"otp" | "card" | "pin">; url: string }
	otp_request_detected: { sourceChannel: Channel; excerpt: string }
	remote_control_detected: { appName?: string }
	screen_share_enabled: { appName?: string }
	new_beneficiary_detected: {
		beneficiaryName: string
		beneficiaryAccount: string
		amount: number
		currency: "MYR"
	}
	high_value_transfer_detected: { amount: number; currency: "MYR" }
	irreversible_payment_detected: { paymentRail: string; amount: number }
	agent_risk_escalated: { agentId: AgentId; beforeMode: CheckMode; afterMode: CheckMode }
	correlation_found: { eventIds: string[]; label: string }
	cross_channel_pattern_detected: { correlationKey: string; channels: Channel[] }
	human_warning_issued: { actions: string[] }
	agent_error: { agentId: AgentId; message: string }
	provider_error: { message: string }
}

export function isSemanticEventType(value: string): value is SemanticEventType {
	return (EVENT_TYPE_VALUES as string[]).includes(value)
}

export function createScamEvent<T extends SemanticEventType>(input: {
	eventId: string
	type: T
	producerId: AgentId
	occurredAt: number
	severity: Severity
	confidence: number
	channel: Channel
	entityRefs: string[]
	summary: string
	payload: EventPayloadMap[T]
	evidenceRef?: string
	correlationKey?: string
}): ScamEvent<T> {
	if (!isSemanticEventType(input.type)) {
		throw new Error(`Unknown semantic event type: ${String(input.type)}`)
	}

	if (input.confidence < 0 || input.confidence > 1) {
		throw new Error("Event confidence must be between 0 and 1")
	}

	return input
}
