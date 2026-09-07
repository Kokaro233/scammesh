import slipSurface from "../../../assets/signal-slip.png"
import { CHANNEL_ICON, CHANNEL_LABEL, CHANNEL_NO } from "../../store/channels"
import type { ChannelState, Signal, SignalRisk, SignalStatus, UiChannel } from "../../store/types"

export function SignalSlip({
	channel,
	title,
	description,
	risk,
	timestamp,
	status,
	activity,
	rotate = 0,
	compact = false,
}: {
	channel: UiChannel
	title: string
	description: string
	risk: SignalRisk
	timestamp: string
	status: SignalStatus
	activity?: string
	rotate?: number
	compact?: boolean
}) {
	const Icon = CHANNEL_ICON[channel]
	const headline = activity ?? title
	const detail = description !== headline ? description : ""

	return (
		<article
			className={`signal-slip${compact ? " is-compact" : ""}`}
			style={{ ["--slip-rotate" as string]: `${rotate}deg` }}
			data-risk={risk}
			data-status={status}
			key={`${status}-${headline}`}
		>
			<img className="signal-slip-surface" src={slipSurface} alt="" />
			<div className="signal-slip-content">
				<div className="signal-slip-top">
					<span className="signal-slip-icon">
						<Icon strokeWidth={1.5} aria-hidden="true" />
					</span>
					<div className="signal-slip-heading">
						<p className="signal-slip-kicker">
							{CHANNEL_NO[channel]} {CHANNEL_LABEL[channel]}
						</p>
						<p className="signal-slip-title" key={headline}>
							{headline}
						</p>
					</div>
				</div>
				{detail ? (
					<p className="signal-slip-copy" key={detail}>
						{detail}
					</p>
				) : null}
				<div className="signal-slip-foot">
					<span className="mono">{timestamp}</span>
					{status !== "monitoring" ? <span className={`signal-slip-state is-${status}`}>{statusLabel(status)}</span> : null}
				</div>
			</div>
		</article>
	)
}

export function SignalSlipFromChannel({
	state,
	rotate,
	compact = false,
}: {
	state: ChannelState
	rotate: number
	compact?: boolean
}) {
	return (
		<SignalSlip
			channel={state.channel}
			title={state.title}
			description={state.description}
			risk={state.risk}
			timestamp={state.timestamp}
			status={state.status}
			activity={state.activity}
			rotate={rotate}
			compact={compact}
		/>
	)
}

export function SignalSlipFromSignal({ signal }: { signal: Signal }) {
	return (
		<SignalSlip
			channel={signal.channel}
			title={signal.title}
			description={signal.description}
			risk={signal.risk}
			timestamp={signal.timestamp}
			status={signal.status}
			compact
		/>
	)
}

function statusLabel(status: SignalStatus): string {
	if (status === "monitoring") return "Monitoring"
	if (status === "checking") return "Checking"
	if (status === "unverified") return "Unverified"
	if (status === "related") return "Related"
	if (status === "confirmed") return "Confirmed"
	return "Delayed"
}
