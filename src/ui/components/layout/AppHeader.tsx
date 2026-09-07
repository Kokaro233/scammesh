import { Bell } from "lucide-react"
import { useScamStore } from "../../store/scamStore"
import type { NavItem } from "./nav"

function formatHeaderDate(now: Date): string {
	return new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(now)
}

export function AppHeader({ page }: { page: NavItem }) {
	const { state } = useScamStore()
	const live = state.demoStatus === "running"

	return (
		<header className="app-header">
			<div className="app-header-copy">
				<h1>{page.label}</h1>
				<p>{page.subtitle}</p>
			</div>
			<div className="app-header-meta">
				<time className="app-header-date mono" dateTime={new Date().toISOString()}>
					{formatHeaderDate(new Date())}
				</time>
				<span className={`app-status${live ? " is-live" : ""}`}>
					{live ? <span className="live-dot" aria-hidden="true" /> : null}
					{live ? "Live" : "Monitoring"}
				</span>
				<button type="button" className="app-icon-btn" aria-label="Notifications">
					<Bell aria-hidden="true" strokeWidth={1.6} />
				</button>
				<span className="app-avatar" aria-hidden="true">
					SM
				</span>
			</div>
		</header>
	)
}
