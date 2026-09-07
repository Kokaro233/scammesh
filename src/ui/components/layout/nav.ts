export const APP_PAGES = ["overview", "live", "signals", "transfer", "history", "settings"] as const

export type AppPage = (typeof APP_PAGES)[number]

export type NavItem = {
	id: AppPage
	label: string
	subtitle: string
	no?: string
}

export const primaryNav: NavItem[] = [
	{ id: "overview", no: "01", label: "Overview", subtitle: "Operations across six channels" },
	{ id: "live", no: "02", label: "Live Detection", subtitle: "6 channels monitoring" },
	{ id: "signals", no: "03", label: "Risk Signals", subtitle: "Event ledger" },
	{ id: "transfer", no: "04", label: "Transfer Check", subtitle: "Review this transfer" },
	{ id: "history", no: "05", label: "History", subtitle: "Security ledger" },
]

export const utilityNav: NavItem[] = [{ id: "settings", label: "Settings", subtitle: "Preferences" }]

const allNav = [...primaryNav, ...utilityNav]

export function getPageMeta(page: AppPage): NavItem {
	const match = allNav.find((item) => item.id === page)
	if (!match) {
		return primaryNav[0]
	}
	return match
}
