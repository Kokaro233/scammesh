import { SemanticEvent } from "@mozaik-ai/core"
import type { Detection } from "../inference/schema"
import { createScamEvent, EVENT_TYPES, type EventPayloadMap, type SemanticEventType } from "../runtime/events"
import type { ScamSessionApi } from "../runtime/scamSessionApi"
import type { AgentId, Channel, Severity } from "../shared/types"

function payloadFor(detection: Detection): EventPayloadMap[SemanticEventType] {
	switch (detection.type) {
		case EVENT_TYPES.IMPERSONATION_CLAIMED:
			return {
				claimedRole: "anti-fraud",
				claimedOrganization: detection.entityRefs[0] ?? "unknown",
			}
		case EVENT_TYPES.COERCION_DETECTED:
			return { tactic: "do-not-hang-up", excerpt: detection.summary }
		case EVENT_TYPES.SECRECY_REQUEST_DETECTED:
		case EVENT_TYPES.URGENCY_DETECTED:
			return { excerpt: detection.summary }
		case EVENT_TYPES.SUSPICIOUS_LINK_DETECTED:
			return {
				url: `https://${detection.entityRefs[0] ?? "unknown"}`,
				hostname: detection.entityRefs[0] ?? "unknown",
			}
		case EVENT_TYPES.OTP_REQUEST_DETECTED:
			return { sourceChannel: "message", excerpt: detection.summary }
		default:
			return { excerpt: detection.summary }
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

	api.sendEvent(SemanticEvent.create(detection.type, participantId, payload), participantId)
	api.resolveRuntime().state.session.events.push(
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
}
