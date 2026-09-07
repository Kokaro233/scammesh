import { useState } from "react"
import { CHANNEL_FILTER_LABEL, CHANNEL_LABEL, CHANNEL_NO, signalRiskLabel } from "../store/channels"
import { useScamStore } from "../store/scamStore"
import type { HistoryItem, HistoryRisk } from "../store/types"

const FILTERS: Array<HistoryRisk | "all"> = ["all", "high", "review", "safe"]

export function HistoryPage() {
	const { state } = useScamStore()
	const [filter, setFilter] = useState<HistoryRisk | "all">("all")
	const [openId, setOpenId] = useState<string | null>(null)
	const rows = state.history.filter((item) => filter === "all" || item.risk === filter)
	const groups = groupByDate(rows)

	return (
		<div className="page-history">
			<div className="sheet-head">
				<p className="ops-heading">Security ledger</p>
				<div className="text-filters" role="tablist" aria-label="Risk filter">
					{FILTERS.map((item) => (
						<button key={item} className={filter === item ? "is-on" : ""} type="button" onClick={() => setFilter(item)}>
							{item === "all"
								? `All ${state.history.length}`
								: `${item} ${state.history.filter((row) => row.risk === item).length}`}
						</button>
					))}
				</div>
			</div>

			{groups.map((group) => (
				<section key={group.date} className="history-group">
					<h2 className="ops-heading">{ledgerDate(group.date)}</h2>
					<ol className="history-ledger">
						{group.rows.map((row) => {
							const open = openId === row.id
							const linked = row.source === "live" ? state.signals : []
							return (
								<li key={row.id} className={open ? "history-block is-open" : "history-block"}>
									<button type="button" className="history-row" onClick={() => setOpenId(open ? null : row.id)}>
										<span className="mono">{row.time}</span>
										<span className="activity-type">
											{row.channel ? `${CHANNEL_NO[row.channel]} ${CHANNEL_LABEL[row.channel]}` : row.type}
										</span>
										<span className="history-main">
											{row.amount ? <strong className="display-serif">{row.amount}</strong> : null}
											{row.description}
										</span>
										<span className={`activity-risk is-${row.risk}`}>{signalRiskLabel(row.risk)}</span>
										<span className={`activity-result is-${row.risk}`}>{row.result}</span>
									</button>
									{open ? (
										<div className="history-detail">
											<p>
												<span>Connected signals</span>
												<strong>{linked.length || (row.source === "seed" ? "—" : 0)}</strong>
											</p>
											<p>
												<span>Reason</span>
												<strong>{row.source === "live" ? state.summary : row.description}</strong>
											</p>
											<p>
												<span>Action</span>
												<strong>{row.result}</strong>
											</p>
											{linked.length > 0 ? (
												<ul>
													{linked.map((signal) => (
														<li key={signal.id}>
															<span className="mono">{signal.timestamp}</span>
															{CHANNEL_FILTER_LABEL[signal.channel]}
															{signal.title}
														</li>
													))}
												</ul>
											) : (
												<p className="empty-row">Standalone ledger record.</p>
											)}
										</div>
									) : (
										<p className="history-link-count">
											{linked.length > 0 ? `${linked.length} linked signals` : "Recorded entry"}
										</p>
									)}
								</li>
							)
						})}
					</ol>
				</section>
			))}
			<p className="ledger-summary">
				<span className="ops-heading">Ledger summary</span>
				<span>
					{state.history.length} recorded events
					<span className="strip-div">·</span>
					{new Set(state.history.map((item) => item.channel).filter(Boolean)).size} channels involved
				</span>
				<span>
					High {state.history.filter((item) => item.risk === "high").length}
					<span className="strip-div">·</span>
					Review {state.history.filter((item) => item.risk === "review").length}
					<span className="strip-div">·</span>
					Safe {state.history.filter((item) => item.risk === "safe").length}
				</span>
			</p>
		</div>
	)
}

function groupByDate(rows: HistoryItem[]) {
	const order: string[] = []
	const map = new Map<string, HistoryItem[]>()
	for (const row of rows) {
		if (!map.has(row.date)) {
			map.set(row.date, [])
			order.push(row.date)
		}
		map.get(row.date)?.push(row)
	}
	return order.map((date) => ({ date, rows: map.get(date) ?? [] }))
}

function ledgerDate(date: string) {
	const match = date.match(/^([A-Za-z]+)\s+(\d+)$/)
	if (!match) return date.toUpperCase()
	return `${match[2].padStart(2, "0")} ${match[1].slice(0, 3).toUpperCase()} 2026`
}
