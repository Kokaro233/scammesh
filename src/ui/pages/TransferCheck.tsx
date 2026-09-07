import type { AppPage } from "../components/layout/nav"
import { TransferReceipt } from "../components/transfer/TransferReceipt"
import { CHANNEL_LABEL } from "../store/channels"
import { usePauseTransfer, useScamStore } from "../store/scamStore"
import type { ScamState, UiChannel } from "../store/types"

const TXN = "TXN-88421"

const CHECK_TEMPLATE: Array<{ label: string; channel?: UiChannel; fallback: string }> = [
	{ label: "Beneficiary", fallback: "First-time beneficiary" },
	{ label: "Caller identity", channel: "call", fallback: "Claimed bank number not found in trusted registry" },
	{ label: "Banking link", channel: "message", fallback: "Domain differs from official bank domain" },
	{ label: "Web page", channel: "browser", fallback: "OTP requested" },
	{ label: "Device session", channel: "device", fallback: "Screen sharing detected during transfer" },
	{ label: "Payment context", channel: "payment", fallback: "High-value transfer to a new beneficiary" },
]

export function TransferCheckPage({ onNavigate }: { onNavigate: (page: AppPage) => void }) {
	const { state } = useScamStore()
	const actions = usePauseTransfer()
	const high = state.riskLevel === "high"
	const paused = state.transfer.status === "paused"
	const pausing = state.transfer.status === "pausing"
	const continued = state.transfer.status === "continued"
	const checks = reviewChecks(state)

	if (!state.transfer.visible) {
		return (
			<div className="page-review">
				<div className="review-receipt">
					<p className="ops-heading">Transfer document</p>
					<p className="empty-row">No active transfer to review</p>
				</div>
				<section className="review-sheet">
					<p className="ops-heading">Transfer review</p>
					<p className="review-reco">
						{recommendation(state)}
					</p>
				</section>
			</div>
		)
	}

	return (
		<div className="page-review">
			<div className="review-receipt">
				<p className="ops-heading">Transfer document</p>
				<TransferReceipt transfer={state.transfer} quiet={state.riskLevel === "normal"} />
			</div>

			<section className="review-sheet">
				<p className="ops-heading">Transfer review</p>
				<p className="review-id mono">{TXN}</p>
				<p className="review-amount display-serif">
					{state.transfer.currency} {state.transfer.amount}
				</p>
				<p className="review-name">{state.transfer.recipient}</p>
				<p className={`review-status status-${state.transfer.status}`}>
					Status
					<strong>{statusLabel(state.transfer.status)}</strong>
				</p>

				<ol className="review-checks">
					{checks.map((item) => (
						<li key={`${item.no}-${item.label}`}>
							<span className="reason-no">{item.no}</span>
							<div>
								<p className="review-check-label">
									{item.channel ? `${CHANNEL_LABEL[item.channel]} / ${item.label}` : item.label}
								</p>
								<p>
									<strong>{item.status}</strong>
									{item.detail}
								</p>
							</div>
						</li>
					))}
				</ol>
				<div className="review-reco">
					<p className="ops-heading">Recommendation</p>
					<p>{recommendation(state)}</p>
					{high ? (
						<div className="review-actions">
							{paused || continued ? (
								<>
									<button className="btn-danger" type="button" onClick={() => onNavigate("history")}>
										View History
									</button>
									<button className="btn-quiet" type="button" onClick={actions.reopen}>
										Open decision
									</button>
								</>
							) : (
								<>
									<button className="btn-danger" type="button" onClick={actions.pause} disabled={pausing}>
										{pausing ? "Pausing..." : "Pause transfer"}
									</button>
									<button className="btn-quiet" type="button" onClick={actions.requestContinue} disabled={pausing}>
										Continue anyway
									</button>
								</>
							)}
						</div>
					) : (
						<p className="empty-row">{actionNote(state)}</p>
					)}
				</div>
			</section>
		</div>
	)
}

function reviewChecks(state: ScamState) {
	return CHECK_TEMPLATE.map((item, index) => {
		if (!item.channel) {
			return {
				no: String(index + 1).padStart(2, "0"),
				label: item.label,
				status: state.transfer.beneficiary,
				detail: state.transfer.beneficiary === "New" ? item.fallback : "Known beneficiary",
			}
		}
		const signal = state.signals.find((entry) => entry.channel === item.channel) ?? state.signals.find((entry) => item.channel === "call" && entry.channel === "identity")
		return {
			no: String(index + 1).padStart(2, "0"),
			channel: item.channel,
			label: item.label,
			status: signal ? (signal.risk === "high" ? "High" : signal.risk === "review" ? "Review" : "Watch") : "Pending",
			detail: signal ? signal.title : "Awaiting channel evidence",
		}
	})
}

function statusLabel(status: ScamState["transfer"]["status"]) {
	if (status === "pausing") return "Pausing"
	if (status === "paused") return "Paused"
	if (status === "continued") return "Continued"
	return "Pending"
}

function recommendation(state: ScamState) {
	if (!state.transfer.visible) return "No active transfer to review."
	if (state.transfer.status === "paused") return "Transfer paused. Verify independently before taking further action."
	if (state.transfer.status === "continued") return "The transfer was allowed to proceed. No real payment is executed in this demo."
	if (state.riskLevel === "high") return "Pause this transfer and verify independently."
	if (state.riskLevel === "review") return "Incomplete risk pattern. Verify before continuing."
	if (state.riskLevel === "watch") return "Some unusual signals detected. Continue monitoring."
	return "No coordinated fraud pattern detected."
}

function actionNote(state: ScamState) {
	if (state.riskLevel === "review") return "Review before continuing"
	if (state.riskLevel === "watch") return "Continue monitoring"
	return "No action recommended"
}
