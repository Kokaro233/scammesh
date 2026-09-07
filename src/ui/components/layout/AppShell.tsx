import { InterventionDialog } from "../risk/InterventionDialog"
import { usePauseTransfer, useScamStore } from "../../store/scamStore"
import type { AppPage } from "./nav"
import { SecurityPaper } from "./SecurityPaper"
import { SessionStrip } from "./SessionStrip"
import { Sidebar } from "./Sidebar"
import { HistoryPage } from "../../pages/History"
import { LiveDetectionPage } from "../../pages/LiveDetection"
import { OverviewPage } from "../../pages/Overview"
import { RiskSignalsPage } from "../../pages/RiskSignals"
import { SettingsPage } from "../../pages/Settings"
import { TransferCheckPage } from "../../pages/TransferCheck"

export function AppShell({
	page,
	onNavigate,
}: {
	page: AppPage
	onNavigate: (page: AppPage) => void
}) {
	const { state } = useScamStore()
	const actions = usePauseTransfer()

	return (
		<div className="app-shell">
			<SecurityPaper />
			<Sidebar page={page} onNavigate={onNavigate} />
			<div className="app-main">
				{page !== "settings" ? <SessionStrip page={page} /> : null}
				<main className={`app-workspace app-workspace-${page}`} key={page}>
					{page === "overview" ? <OverviewPage onStartDemo={() => onNavigate("live")} /> : null}
					{page === "live" ? <LiveDetectionPage onNavigate={onNavigate} /> : null}
					{page === "signals" ? <RiskSignalsPage /> : null}
					{page === "transfer" ? <TransferCheckPage onNavigate={onNavigate} /> : null}
					{page === "history" ? <HistoryPage /> : null}
					{page === "settings" ? <SettingsPage /> : null}
				</main>
			</div>
			<InterventionDialog
				phase={state.intervention}
				transfer={state.transfer}
				onConfirmContinue={actions.confirmContinue}
				onDismiss={actions.dismiss}
				onNavigate={onNavigate}
			/>
		</div>
	)
}
