import {
	type SituationContext,
	type SituationHandler,
	type SituationProcessor,
	SituationSpecification,
} from "@mozaik-ai/core"
import { EVENT_TYPES, type EventPayloadMap } from "../../runtime/events"
import type { ScamSessionApi } from "../../runtime/scamSessionApi"
import type { IdentityLookup } from "../../shared/types"
import { inspectIdentityLookups } from "./whenIdentityFeed"

export class WhenBrowserEmitsDomainMismatch extends SituationSpecification {
	isSatisfiedBy({ event, participant }: SituationContext): boolean {
		return event.type === EVENT_TYPES.DOMAIN_MISMATCH_DETECTED && event.producerId !== participant.getId()
	}
}

export class VerifyClaimedBrandProcessor implements SituationProcessor {
	constructor(private readonly api: ScamSessionApi) {}

	apply(context: SituationContext): void {
		const payload = context.event.payload as EventPayloadMap["domain_mismatch_detected"]
		const lookup: IdentityLookup = {
			kind: "domain",
			value: payload.hostname,
			claimedOrganization: payload.claimedBrand,
		}
		const state = this.api.resolveRuntime().state
		if (!state.identityLookups.some((item) => item.kind === lookup.kind && item.value === lookup.value)) {
			state.identityLookups.push(lookup)
		}

		void inspectIdentityLookups(this.api, context.participant.getId())
	}
}

export function createDomainMismatchIdentityHandler(api: ScamSessionApi): SituationHandler {
	return {
		specification: new WhenBrowserEmitsDomainMismatch(),
		processor: new VerifyClaimedBrandProcessor(api),
	}
}
