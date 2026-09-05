import type { UiEvent } from "../shared/uiEvents"

function labelFor(event: UiEvent) {
	switch (event.kind) {
		case "observation":
			return `${event.agentId}: ${event.summary}`
		case "semantic_event":
			return `${event.event.producerId} emitted ${event.event.type}`
		case "adaptation":
			return event.adaptation.reason
		case "risk_escalation":
			return `Risk ${event.snapshot.level} (${event.snapshot.score})`
		case "started":
			return `Started ${event.scenarioId}`
		case "finished":
			return "Feed playback finished"
		case "reset":
			return "Simulation reset"
	}
}

export function EventTimeline({ events }: { events: UiEvent[] }) {
	return (
		<section className="timeline">
			<h3>Event timeline</h3>
			<ol>
				{events.length === 0 ? (
					<li>Waiting for concurrent agent activity…</li>
				) : (
					events.map((event, index) => (
						<li key={`${event.kind}-${index}`}>
							<span className="kind">{event.kind.replaceAll("_", " ")}</span>
							{labelFor(event)}
						</li>
					))
				)}
			</ol>
		</section>
	)
}
