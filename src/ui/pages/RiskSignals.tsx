import { useEffect, useState } from "react"
import { SignalSlipFromSignal } from "../components/signals/SignalSlip"
import { CHANNEL_FILTER_LABEL, CHANNEL_LABEL, CHANNEL_NO, signalRiskLabel } from "../store/channels"
import { useScamStore } from "../store/scamStore"
import { UI_CHANNELS, type Signal, type UiChannel } from "../store/types"

export function RiskSignalsPage() {
	const { state } = useScamStore()
	const [filter, setFilter] = useState<UiChannel | "all">("all")
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const rows = ledgerRows(state.signals, filter)
	const selected = rows.find((item) => item.id === selectedId) ?? rows[0] ?? null
	const linked = selected?.signal ? linkedSignals(selected.signal, state.signals, state.connections) : []

	useEffect(() => {
		if (selected && selected.id !== selectedId) {
			setSelectedId(selected.id)
		}
		if (!selected) {
			setSelectedId(null)
		}
	}, [selected, selectedId])

	return (
		<div className="page-signals">
			<div className="sheet-head">
				<p className="ops-heading">Risk signals</p>
				<div className="text-filters" role="tablist" aria-label="Channel filter">
					<button className={filter === "all" ? "is-on" : ""} type="button" onClick={() => setFilter("all")}>
						All {state.signals.length}
					</button>
					{UI_CHANNELS.map((channel) => (
						<button
							key={channel}
							className={filter === channel ? "is-on" : ""}
							type="button"
							onClick={() => setFilter(channel)}
						>
							{CHANNEL_FILTER_LABEL[channel]} {state.signals.filter((item) => item.channel === channel).length}
						</button>
					))}
				</div>
			</div>

			<div className="signals-split">
				<ol className="signal-ledger">
					{rows.length === 0 ? <li className="empty-row">No risk signals yet. Channel monitoring is not a signal.</li> : null}
					{rows.map((row) => {
						const active = selected?.id === row.id
						return (
							<li key={row.id}>
								<button
									type="button"
									className={active ? "signal-row is-active" : "signal-row"}
									onClick={() => setSelectedId(row.id)}
								>
									<span className="mono">{row.time}</span>
									<span className="activity-type">
										{row.no} / {CHANNEL_LABEL[row.channel]}
									</span>
									<span>{row.title}</span>
									<span className={`activity-risk is-${row.risk}`}>{signalRiskLabel(row.risk)}</span>
								</button>
							</li>
						)
					})}
				</ol>

				<section className="signal-inspector" aria-label="Signal inspector">
					{selected ? (
						<>
							<p className="ops-heading">
								{CHANNEL_NO[selected.channel]} / {CHANNEL_LABEL[selected.channel]} signal
							</p>
							<div className="inspect-hero">
								<SignalSlipFromSignal signal={selected.signal} />
								<p className={`inspect-status is-${selected.risk}`}>
									Status
									<strong>{signalRiskLabel(selected.risk)}</strong>
								</p>
							</div>
							<dl className="inspect-fields">
								<div>
									<dt>Signal</dt>
									<dd>{selected.title}</dd>
								</div>
								<div>
									<dt>Detail</dt>
									<dd>{selected.detail}</dd>
								</div>
								<div>
									<dt>First detected</dt>
									<dd className="mono">{selected.time}</dd>
								</div>
							</dl>
							<p className="ops-heading inspect-sub">Connected to</p>
							{linked.length === 0 ? <p className="empty-row">No mesh links yet.</p> : null}
							<ul className="inspect-links">
								{linked.map((item) => {
									const index = state.signals.findIndex((signal) => signal.id === item.id) + 1
									return (
										<li key={item.id}>
											<div>
												<span className="mono">
													{String(index).padStart(2, "0")} / {CHANNEL_LABEL[item.channel]}
												</span>
												<span>{item.title}</span>
											</div>
											<i className="corr-node" aria-hidden="true" />
										</li>
									)
								})}
							</ul>
						</>
					) : (
						<p className="empty-row">No risk signal selected. Monitoring states stay on Live Detection.</p>
					)}
				</section>
			</div>
		</div>
	)
}

function ledgerRows(signals: Signal[], filter: UiChannel | "all") {
	return signals
		.filter((item) => filter === "all" || item.channel === filter)
		.map((item) => {
			const no = String(signals.findIndex((signal) => signal.id === item.id) + 1).padStart(2, "0")
			return {
				id: item.id,
				no,
				time: item.timestamp,
				channel: item.channel,
				title: item.title,
				detail: item.description,
				risk: item.risk,
				status: item.status,
				kind: "signal" as const,
				signal: item,
			}
		})
}

function linkedSignals(signal: Signal, signals: Signal[], connections: { source: UiChannel; target: UiChannel }[]) {
	const neighbors = new Set<UiChannel>()
	for (const link of connections) {
		if (link.source === signal.channel) neighbors.add(link.target)
		if (link.target === signal.channel) neighbors.add(link.source)
	}
	return signals.filter((item) => item.id !== signal.id && neighbors.has(item.channel))
}
