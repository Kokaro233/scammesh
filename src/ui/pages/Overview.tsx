import { useEffect, useRef, useState } from "react"
import { DemoProcess } from "../components/demo/DemoProcess"
import { CHANNEL_FILTER_LABEL, CHANNEL_LABEL, CHANNEL_NO, signalRiskLabel } from "../store/channels"
import { recentActivity } from "../store/reducer"
import { useDemoSession, useScamStore } from "../store/scamStore"
import { UI_CHANNELS, type ScamState, type SignalConnection, type UiChannel } from "../store/types"

export function OverviewPage({ onStartDemo }: { onStartDemo: () => void }) {
	const { state } = useScamStore()
	const session = useDemoSession()
	const week = state.weekActivity
	const rows = ledgerRows(state)
	const max = Math.max(...week.map((day) => day.safe + day.review + day.high), 1)
	const activeChannels = todayChannels(state)
	const correlations = overviewCorrelations(state.connections)
	const highPriority = state.signals.filter((item) => item.risk === "high").length
	const last = week.length - 1
	const [hoverDay, setHoverDay] = useState<number | null>(null)
	const [pinnedDay, setPinnedDay] = useState<number | null>(null)
	const focusDay = hoverDay ?? pinnedDay ?? last
	const insight = dayInsight(state, week, focusDay)

	return (
		<div className="page-overview">
			<DemoProcess
				showStart
				onStart={() => {
					onStartDemo()
					void session.start({ scenarioId: "bank-impersonation", speed: "fast" })
				}}
			/>
			<section className="ops-today" aria-label="Today">
				<p className="ops-today-label">Today</p>
				<div className="ops-today-metrics">
					<Metric value={state.overviewStats.riskSignals} label="Risk signals" note="this session" />
					<Metric
						value={state.overviewStats.needReview}
						label="Need review"
						note={highPriority > 0 ? `${highPriority} high priority` : "this session"}
					/>
					<Metric
						value={state.overviewStats.transfersProtected}
						label="Transfers protected"
						note={
							state.transfer.status === "paused" && state.transfer.amount
								? `${state.transfer.currency} ${state.transfer.amount}`
								: "this session"
						}
					/>
					<Metric value={state.overviewStats.identityChecks} label="Identity checks" note="this session" />
				</div>
			</section>

			<section className="ops-activity">
				<div className="chart-head">
					<div>
						<h2 className="ops-heading">Risk activity</h2>
						<p className="chart-range mono">This session</p>
					</div>
					<p className="chart-key">
						<span className="key-safe">Safe</span>
						<span className="key-review">Review</span>
						<span className="key-high">High</span>
					</p>
				</div>
				<div className="ledger-chart">
					<div className="chart-scale" aria-hidden="true">
						<span>{max}</span>
						<span>{Math.round(max / 2)}</span>
						<span>0</span>
					</div>
					<div className="chart-plot" onMouseLeave={() => setHoverDay(null)}>
						<div className="ledger-guides" aria-hidden="true">
							<span />
							<span />
							<span />
						</div>
						<div className="week-chart" role="list" aria-label="Seven day risk activity">
							{week.map((day, index) => {
								const total = day.safe + day.review + day.high
								const today = index === last
								const focused = focusDay === index
								return (
									<button
										key={`${day.label}-${index}`}
										type="button"
										role="listitem"
										className={`week-col${today ? " is-today" : ""}${focused ? " is-focus" : ""}`}
										aria-pressed={pinnedDay === index}
										aria-label={`${day.label}, ${total} signals`}
										onMouseEnter={() => setHoverDay(index)}
										onFocus={() => setHoverDay(index)}
										onClick={() => setPinnedDay(index === pinnedDay ? null : index)}
									>
										<div className="week-stack" style={{ animationDelay: `${40 + index * 70}ms` }}>
											<span style={{ height: `${(day.safe / max) * 100}%` }} className="seg-safe" />
											<span style={{ height: `${(day.review / max) * 100}%` }} className="seg-review" />
											<span style={{ height: `${(day.high / max) * 100}%` }} className="seg-high" />
										</div>
										<span className="week-date">{day.label.padStart(2, "0")}</span>
									</button>
								)
							})}
						</div>
					</div>
				</div>
				<div className="day-insight" key={`${insight.date}-${insight.total}-${insight.pairs.join("|")}`}>
					<p className="mono">{insight.date}</p>
					<p>
						{insight.total} signals
						<span className="strip-div">·</span>
						{insight.channels} {insight.channels === 1 ? "channel" : "channels"} involved
					</p>
					{insight.pairs.length === 0 ? <p className="empty-row">No recorded correlations</p> : null}
					<ul>
						{insight.pairs.map((pair) => (
							<li key={pair}>{pair}</li>
						))}
					</ul>
				</div>
				<div className="channel-marks" aria-label="Channel activity today">
					{UI_CHANNELS.map((channel) => (
						<span key={channel} className={activeChannels.has(channel) ? "channel-mark is-on" : "channel-mark"}>
							<i aria-hidden="true" />
							<span className="mono">{CHANNEL_NO[channel]}</span>
							{CHANNEL_FILTER_LABEL[channel]}
						</span>
					))}
				</div>
			</section>

			<section className="ops-correlations">
				<h2 className="ops-heading">Active correlations</h2>
				<ul className="corr-list">
					{correlations.length === 0 ? <li className="empty-row">No active correlations in this session.</li> : null}
					{correlations.map((item) => (
						<li key={item.id} className="corr-item">
							<div className="corr-link">
								<span>
									{CHANNEL_NO[item.source]} {CHANNEL_LABEL[item.source]}
								</span>
								<span className="corr-line" aria-hidden="true">
									<i />
								</span>
								<span>
									{CHANNEL_NO[item.target]} {CHANNEL_LABEL[item.target]}
								</span>
							</div>
							<p>
								<span className="corr-short">{item.reason}</span>
								<span className="corr-hover">{item.reason}</span>
							</p>
						</li>
					))}
				</ul>
			</section>

			<section className="ops-ledger">
				<h2 className="ops-heading">Recent activity</h2>
				<ol className="activity-ledger">
					{rows.length === 0 ? <li className="empty-row">No activity in this session yet.</li> : null}
					{rows.map((row) => (
						<li key={`${row.time}-${row.detail}`} className="activity-row">
							<span className="mono">{row.time}</span>
							<span className="activity-type">{row.type}</span>
							<span>{row.detail}</span>
							<span className={`activity-risk is-${row.risk}`}>{signalRiskLabel(row.risk === "safe" ? "low" : row.risk)}</span>
							<span className={`activity-result is-${row.risk}`}>{row.result}</span>
						</li>
					))}
				</ol>
			</section>
		</div>
	)
}

function Metric({ value, label, note }: { value: number; label: string; note: string }) {
	const shown = useCountTo(value)
	return (
		<div className="ops-metric">
			<strong className="tabular">{shown}</strong>
			<span>{label}</span>
			<em>{note}</em>
		</div>
	)
}

function useCountTo(value: number): number {
	const [shown, setShown] = useState(value)
	const fromRef = useRef(value)

	useEffect(() => {
		const from = fromRef.current
		fromRef.current = value
		if (from === value) {
			setShown(value)
			return
		}
		const started = performance.now()
		let frame = 0
		const tick = (now: number) => {
			const t = Math.min(1, (now - started) / 420)
			setShown(Math.round(from + (value - from) * t))
			if (t < 1) {
				frame = window.requestAnimationFrame(tick)
			}
		}
		frame = window.requestAnimationFrame(tick)
		return () => window.cancelAnimationFrame(frame)
	}, [value])

	return shown
}

function todayChannels(state: ReturnType<typeof useScamStore>["state"]): Set<UiChannel> {
	const next = new Set<UiChannel>()
	for (const item of state.signals) {
		next.add(item.channel)
	}
	for (const item of state.history) {
		if (item.channel && item.source === "live") {
			next.add(item.channel)
		}
	}
	return next
}

function overviewCorrelations(connections: SignalConnection[]): Array<Pick<SignalConnection, "id" | "source" | "target" | "reason">> {
	return connections.slice(-3).reverse()
}

function dayInsight(state: ScamState, week: ScamState["weekActivity"], index: number) {
	const day = week[index]
	const total = day.safe + day.review + day.high
	const date = sessionDayLabel(week.length - 1 - index)
	if (index === week.length - 1) {
		const channels = todayChannels(state)
		const pairs = [...new Set(state.connections.map((item) => `${CHANNEL_LABEL[item.source].toUpperCase()} ↔ ${CHANNEL_LABEL[item.target].toUpperCase()}`))]
		return { date, total, channels: channels.size, pairs }
	}
	return { date, total, channels: 0, pairs: [] as string[] }
}

function sessionDayLabel(daysAgo: number) {
	const date = new Date()
	date.setDate(date.getDate() - daysAgo)
	const day = String(date.getDate()).padStart(2, "0")
	const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase()
	return `${day} ${month}`
}

function ledgerRows(state: ReturnType<typeof useScamStore>["state"]) {
	if (state.signals.length === 0) {
		return state.history.slice(0, 4).map((item) => ({
			time: item.time,
			type: item.channel ? CHANNEL_FILTER_LABEL[item.channel] : item.type,
			detail: item.amount ? `${item.amount} ${item.description}` : item.description,
			risk: item.risk,
			result: item.result,
		}))
	}
	return recentActivity(state).map((row, index) => {
		const signal = [...state.signals].reverse()[index]
		return {
			...row,
			type: signal ? CHANNEL_FILTER_LABEL[signal.channel] : row.type,
			result: signal?.status === "confirmed" ? "Flagged" : "Open",
		}
	})
}
