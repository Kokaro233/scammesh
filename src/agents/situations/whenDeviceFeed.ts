import {
	Agent,
	type SituationContext,
	type SituationHandler,
	type SituationProcessor,
	SituationSpecification,
} from "@mozaik-ai/core"
import { ANALYSIS_SCHEMA } from "../../inference/schema"
import type { ScamSessionApi } from "../../runtime/scamSessionApi"
import type { DeviceTelemetry } from "../../shared/types"
import { FEED_EVENTS } from "../feedEvents"
import { publishDetection } from "../publishDetection"

export class WhenDeviceFeedArrives extends SituationSpecification {
	isSatisfiedBy({ event, participant }: SituationContext): boolean {
		return event.type === FEED_EVENTS.DEVICE && event.producerId !== participant.getId()
	}
}

export async function inspectCurrentTelemetry(api: ScamSessionApi, participantId: string) {
	const state = api.resolveRuntime().state
	for (const [index, telemetry] of state.deviceTelemetry.entries()) {
		state.analyzeLog.push({ agentId: "device", channel: "device", payload: telemetry })
		const result = await api.inference.analyze({ channel: "device", payload: telemetry }, ANALYSIS_SCHEMA, {
			agentId: "device",
			channel: "device",
			mode: state.session.agentModes.device,
			registry: state.registry,
		})

		result.detections.forEach((detection, detectionIndex) => {
			publishDetection(api, {
				participantId,
				agentId: "device",
				channel: "device",
				detection,
				eventId: `device-${index}-${detectionIndex}-${telemetry.kind}`,
				eventPayload: { appName: telemetry.appName },
			})
		})
	}
}

export class AnalyzeDeviceFeedProcessor implements SituationProcessor {
	constructor(private readonly api: ScamSessionApi) {}

	apply(context: SituationContext): void {
		if (!(context.participant instanceof Agent)) {
			return
		}

		const telemetry = context.event.payload as DeviceTelemetry
		this.api.resolveRuntime().state.deviceTelemetry.push(telemetry)
		void inspectCurrentTelemetry(this.api, context.participant.getId())
	}
}

export function createDeviceFeedHandler(api: ScamSessionApi): SituationHandler {
	return {
		specification: new WhenDeviceFeedArrives(),
		processor: new AnalyzeDeviceFeedProcessor(api),
	}
}
