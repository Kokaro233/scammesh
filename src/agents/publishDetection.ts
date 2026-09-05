import { SemanticEvent } from "@mozaik-ai/core"
import type { Detection } from "../inference/schema"
import { createScamEvent, EVENT_TYPES, type EventPayloadMap, type SemanticEventType } from "../runtime/events"
import type { ScamSessionApi } from "../runtime/scamSessionApi"
import type { AgentId, Channel, EntityKind, ScamEntity, Severity } from "../shared/types"

function isSecret(value: string): value is "otp" | "card" | "pin" {
	return value === "otp" || value === "card" || value === "pin"
}

function isIdentityKind(value: string): value is "phone" | "domain" | "beneficiary" {
	return value === "phone" || value === "domain" || value === "beneficiary"
}

function hostnameFromRefs(refs: string[]) {
	return refs.find((ref) => ref.includes(".")) ?? refs[0] ?? "unknown"
}

function payloadFor(detection: Detection): EventPayloadMap[SemanticEventType] {
	const refs = detection.entityRefs
	switch (detection.type) {
		case EVENT_TYPES.IMPERSONATION_CLAIMED:
			return {
				claimedRole: "anti-fraud",
				claimedOrganization: refs[0] ?? "unknown",
			}
		case EVENT_TYPES.COERCION_DETECTED:
			return { tactic: "do-not-hang-up", excerpt: detection.summary }
		case EVENT_TYPES.SECRECY_REQUEST_DETECTED:
		case EVENT_TYPES.URGENCY_DETECTED:
			return { excerpt: detection.summary }
		case EVENT_TYPES.SUSPICIOUS_LINK_DETECTED:
			return {
				url: `https://${hostnameFromRefs(refs)}`,
				hostname: hostnameFromRefs(refs),
			}
		case EVENT_TYPES.DOMAIN_MISMATCH_DETECTED:
			return {
				hostname: hostnameFromRefs(refs),
				claimedBrand: refs.find((ref) => !ref.includes(".") && !isSecret(ref)) ?? "unknown",
			}
		case EVENT_TYPES.CREDENTIAL_HARVESTING_DETECTED:
			return {
				requestedSecrets: refs.filter(isSecret),
				url: `https://${hostnameFromRefs(refs)}`,
			}
		case EVENT_TYPES.OTP_REQUEST_DETECTED:
			return { sourceChannel: "message", excerpt: detection.summary }
		case EVENT_TYPES.OFFICIAL_IDENTITY_MISMATCH: {
			const kindFromRef = refs.find(isIdentityKind)
			const claimed =
				refs.find((ref) => ref.includes(".") || ref.startsWith("+")) ??
				refs.find((ref) => !isIdentityKind(ref) && !/bank/i.test(ref)) ??
				refs[0] ??
				"unknown"
			return {
				kind:
					kindFromRef ??
					(claimed.startsWith("+") ? "phone" : claimed.includes(".") ? "domain" : "beneficiary"),
				claimed,
				officialHint: "local trusted registry mock — not a live bank feed",
			}
		}
		case EVENT_TYPES.UNVERIFIED_CONTACT_DETECTED:
			return {
				contact: refs[0] ?? "unknown",
				contactKind: refs[1] === "domain" ? "domain" : "phone",
			}
		default:
			return { excerpt: detection.summary }
	}
}

function entityKindFor(value: string): EntityKind | undefined {
	if (isSecret(value) || isIdentityKind(value) || value.length === 0) {
		return undefined
	}
	if (value.includes(".")) {
		return "domain"
	}
	if (value.startsWith("+")) {
		return "phone"
	}
	if (/bank/i.test(value)) {
		return "bank"
	}
	return undefined
}

function upsertSharedEntity(entities: Record<string, ScamEntity>, value: string, channel: Channel) {
	const kind = entityKindFor(value)
	if (!kind) {
		return
	}

	const entityId = `${kind}:${value.toLowerCase().replace(/\s+/g, "-")}`
	const existing = entities[entityId]
	if (existing) {
		if (!existing.channelRefs.includes(channel)) {
			existing.channelRefs.push(channel)
		}
		return
	}

	entities[entityId] = {
		entityId,
		kind,
		value,
		label: value,
		channelRefs: [channel],
	}
}

export function publishDetection(
	api: ScamSessionApi,
	input: {
		participantId: string
		agentId: AgentId
		channel: Channel
		detection: Detection
		eventId: string
	},
) {
	const { participantId, agentId, channel, detection, eventId } = input
	const payload = payloadFor(detection)
	const state = api.resolveRuntime().state

	api.sendEvent(SemanticEvent.create(detection.type, participantId, payload), participantId)
	state.session.events.push(
		createScamEvent({
			eventId,
			type: detection.type,
			producerId: agentId,
			occurredAt: Date.now(),
			severity: detection.severity as Severity,
			confidence: detection.confidence,
			channel,
			entityRefs: detection.entityRefs,
			summary: detection.summary,
			payload,
		}),
	)

	for (const ref of detection.entityRefs) {
		upsertSharedEntity(state.session.entities, ref, channel)
	}

	if (detection.type === EVENT_TYPES.OFFICIAL_IDENTITY_MISMATCH && "kind" in payload) {
		state.identityMismatches.push(payload)
	}
}
