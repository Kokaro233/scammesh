import { CoordinationPanel } from "../components/coordination/CoordinationPanel"
import { DemoControls } from "../components/demo/DemoControls"
import { DemoProcess } from "../components/demo/DemoProcess"
import { SignalMesh } from "../components/mesh/SignalMesh"
import { RiskAssessment } from "../components/risk/RiskAssessment"
import { SignalSlipFromChannel } from "../components/signals/SignalSlip"
import { PaymentMonitor } from "../components/transfer/PaymentMonitor"
import { TransferReceipt } from "../components/transfer/TransferReceipt"
import type { AppPage } from "../components/layout/nav"
import { CHANNEL_LAYOUT, RECEIPT_LAYOUT } from "../store/channels"
import { usePauseTransfer, useScamStore } from "../store/scamStore"
import { UI_CHANNELS } from "../store/types"

export function LiveDetectionPage({ onNavigate }: { onNavigate: (page: AppPage) => void }) {
	const { state, dispatch } = useScamStore()
	const actions = usePauseTransfer()
	const quiet = state.riskLevel === "normal" && state.signals.length === 0

	return (
		<div className="page-live">
			<div className="live-toolbar">
				<div>
					<p className="live-title">Live detection</p>
					<p className="live-sub">6 channels monitoring</p>
				</div>
				<button className="text-link" type="button" onClick={() => dispatch({ type: "SET_PAGE_UI", coordinationOpen: true })}>
					Coordination log
				</button>
				<DemoControls />
			</div>
			<DemoProcess compact />

			<div className="live-body">
				<div className={`live-canvas is-${state.riskLevel}`}>
					<SignalMesh connections={state.connections} />
					{UI_CHANNELS.map((channel, index) => (
						<div
							key={channel}
							className={`desk-node desk-node-${channel}`}
							style={{
								left: `${CHANNEL_LAYOUT[channel].x}%`,
								top: `${CHANNEL_LAYOUT[channel].y}%`,
								animationDelay: `${80 + index * 45}ms`,
							}}
						>
							<SignalSlipFromChannel state={state.channelStates[channel]} rotate={CHANNEL_LAYOUT[channel].rotate} />
						</div>
					))}
					<div className="desk-receipt" style={{ left: `${RECEIPT_LAYOUT.x}%`, top: `${RECEIPT_LAYOUT.y}%` }}>
						{state.transfer.visible ? (
							<TransferReceipt transfer={state.transfer} quiet={quiet} />
						) : (
							<PaymentMonitor />
						)}
					</div>
				</div>

				<RiskAssessment
					score={state.riskScore}
					level={state.riskLevel}
					headline={state.headline}
					summary={state.summary}
					reasons={state.reasons}
					stampVisible={state.stampVisible}
					transfer={state.transfer}
					onPause={actions.pause}
					onContinue={actions.requestContinue}
					onReopen={actions.reopen}
					onViewHistory={() => onNavigate("history")}
					onReviewTransfer={() => onNavigate("transfer")}
				/>
			</div>

			<CoordinationPanel
				open={state.coordinationOpen}
				events={state.coordinationEvents}
				onClose={() => dispatch({ type: "SET_PAGE_UI", coordinationOpen: false })}
			/>
		</div>
	)
}
