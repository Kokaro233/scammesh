import type { AgentCardView } from "../shared/agentCard"

export function AgentCard({ agent }: { agent: AgentCardView }) {
	return (
		<article className={`agent-card${agent.status === "RUNNING" ? " running" : ""}`}>
			<div className="meta">
				<span>{agent.channel}</span>
				<span>
					{agent.status} · {agent.mode}
				</span>
			</div>
			<h3>{agent.name}</h3>
			<p>
				<strong>Watching: </strong>
				{agent.latestObservation}
			</p>
			<p>
				<strong>Latest event: </strong>
				{agent.latestEventType ?? "none yet"}
			</p>
			<p>
				<strong>Adaptation: </strong>
				{agent.lastAdaptationReason ?? "no adaptation yet"}
			</p>
		</article>
	)
}
