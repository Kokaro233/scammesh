import type { SimulationStateView } from "../shared/simulationView"
import type { UiEvent } from "../shared/uiEvents"
import { AgentCard } from "./AgentCard"
import { EventTimeline } from "./EventTimeline"
import { RiskPanel } from "./RiskPanel"
import { LiveScamGraph } from "./LiveScamGraph"

export function DefenseRoom({
	state,
	events,
	onReset,
}: {
	state: SimulationStateView
	events: UiEvent[]
	onReset: () => void
}) {
	return (
		<main className="room">
			<header className="topbar">
				<div>
					<p className="tagline">Live Defense Room</p>
					<div className="score">
						<strong className={`level-${state.session.riskLevel}`}>{state.session.overallRisk}</strong>
						<span className={`level-${state.session.riskLevel}`}>{state.session.riskLevel}</span>
						<span>{state.status}</span>
					</div>
				</div>
				<button className="ghost" type="button" onClick={onReset}>
					Reset
				</button>
			</header>
			<RiskPanel state={state} />
			<section className="workspace">
				<div className="agent-grid">
					{state.agents.map((agent) => (
						<AgentCard key={agent.agentId} agent={agent} />
					))}
				</div>
				<LiveScamGraph state={state} />
			</section>
			<EventTimeline events={events} />
		</main>
	)
}
