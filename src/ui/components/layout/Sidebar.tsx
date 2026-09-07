import { ArrowLeftRight, History, LayoutDashboard, Radio, ScanSearch, Settings } from "lucide-react"
import type { AppPage } from "./nav"
import { primaryNav, utilityNav } from "./nav"

const icons = {
	overview: LayoutDashboard,
	live: Radio,
	signals: ScanSearch,
	transfer: ArrowLeftRight,
	history: History,
	settings: Settings,
} as const

export function Sidebar({
	page,
	onNavigate,
}: {
	page: AppPage
	onNavigate: (page: AppPage) => void
}) {
	return (
		<aside className="sidebar">
			<div className="sidebar-brand">
				<p className="brand-mark" aria-label="ScamMesh">
					<span aria-hidden="true">
						<span className="brand-s">S</span>camMesh
					</span>
				</p>
				<p className="brand-sub">Cross-channel protection</p>
			</div>

			<nav className="sidebar-nav" aria-label="Primary">
				{primaryNav.map((item) => {
					const Icon = icons[item.id]
					const active = page === item.id
					return (
						<button
							key={item.id}
							type="button"
							className={active ? "sidebar-item is-active" : "sidebar-item"}
							aria-current={active ? "page" : undefined}
							onClick={() => onNavigate(item.id)}
						>
							<span className="sidebar-no mono">{item.no}</span>
							<Icon className="sidebar-icon" aria-hidden="true" strokeWidth={1.5} />
							<span>{item.label}</span>
						</button>
					)
				})}
			</nav>

			<div className="sidebar-footer">
				{utilityNav.map((item) => {
					const Icon = icons[item.id]
					const active = page === item.id
					return (
						<button
							key={item.id}
							type="button"
							className={active ? "sidebar-item is-active" : "sidebar-item"}
							aria-current={active ? "page" : undefined}
							onClick={() => onNavigate(item.id)}
						>
							<Icon className="sidebar-icon" aria-hidden="true" strokeWidth={1.5} />
							<span>{item.label}</span>
						</button>
					)
				})}
				<p className="sidebar-sys">
					<span className="mono">6 / 6</span> channels online
					<br />
					System monitoring
				</p>
			</div>
		</aside>
	)
}
