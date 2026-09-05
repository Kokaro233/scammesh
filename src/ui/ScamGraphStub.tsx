import { AGENT_IDS } from "../shared/types"
import { AGENT_CARD_META } from "../shared/agentCard"
import type { SimulationStateView } from "../shared/simulationView"

export function ScamGraphStub({ state }: { state: SimulationStateView }) {
	const active = new Set(state.session.events.map((event) => event.channel))

	return (
		<section className="graph">
			<h3>Scam graph</h3>
			<p>Nodes light up when that channel publishes. Edges arrive when correlations form.</p>
			<div className="graph-nodes">
				{AGENT_IDS.map((agentId) => (
					<div
						key={agentId}
						className={`graph-node${active.has(AGENT_CARD_META[agentId].channel) ? " active" : ""}`}
					>
						{AGENT_CARD_META[agentId].name.replace(" Agent", "")}
					</div>
				))}
			</div>
			<p>
				{state.session.correlations.length > 0
					? `${state.session.correlations.length} correlation edges ready`
					: "No correlation edges yet"}
			</p>
		</section>
	)
}
