import { CHANNEL_FILTER_LABEL } from "../../store/channels"
import type { CoordinationEvent } from "../../store/types"

export function CoordinationPanel({
	open,
	events,
	onClose,
}: {
	open: boolean
	events: CoordinationEvent[]
	onClose: () => void
}) {
	if (!open) {
		return null
	}

	return (
		<div className="drawer-layer">
			<button className="drawer-backdrop" type="button" aria-label="Close coordination log" onClick={onClose} />
			<aside className="drawer-panel" aria-label="Coordination log">
				<div className="drawer-head">
					<div>
						<p className="panel-kicker">Coordination log</p>
						<h2>Concurrent protection</h2>
					</div>
					<button className="btn-quiet" type="button" onClick={onClose}>
						Close
					</button>
				</div>
				<p className="drawer-note">Concurrent protection active. One channel can change how another checks.</p>
				<ol className="coord-list">
					{events.length === 0 ? <li className="empty-row">No coordination events yet.</li> : null}
					{events.map((event) => (
						<li key={event.id}>
							<p className="mono">{event.timestamp}</p>
							<p>
								{CHANNEL_FILTER_LABEL[event.source]}
								{event.target ? ` → ${CHANNEL_FILTER_LABEL[event.target]}` : ""}
							</p>
							<p>{event.type}</p>
							<p>{event.description}</p>
						</li>
					))}
				</ol>
			</aside>
		</div>
	)
}
