import {
	Agent,
	type SituationContext,
	type SituationHandler,
	type SituationProcessor,
	SituationSpecification,
} from "@mozaik-ai/core"
import type { ScamSessionApi } from "../../runtime/scamSessionApi"
import type { AgentId } from "../../shared/types"

export class WhenOthersSendAMessage extends SituationSpecification {
	isSatisfiedBy({ event, participant }: SituationContext): boolean {
		return event.type === "message.sent" && event.producerId !== participant.getId()
	}
}

export class StartAgentLoopProcessor implements SituationProcessor {
	constructor(
		private readonly api: ScamSessionApi,
		private readonly model: string,
		private readonly agentId: AgentId,
	) {}

	apply(context: SituationContext): void {
		if (!(context.participant instanceof Agent)) {
			return
		}

		const { message } = context.event.payload as { message: string }
		this.api.resolveRuntime().state.session.agentStatuses[this.agentId] = "RUNNING"
		this.api.runLoop(context.participant.getId(), message, {
			model: this.model,
			context: context.participant.getMemory().getContext(),
			tools: context.participant.getTools(),
		})
	}
}

export function createStartLoopHandler(api: ScamSessionApi, model: string, agentId: AgentId): SituationHandler {
	return {
		specification: new WhenOthersSendAMessage(),
		processor: new StartAgentLoopProcessor(api, model, agentId),
	}
}
