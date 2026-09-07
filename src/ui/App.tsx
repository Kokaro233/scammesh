import { useEffect, useState } from "react"
import { AppShell } from "./components/layout/AppShell"
import { APP_PAGES, type AppPage } from "./components/layout/nav"
import { ScamProvider, useLiveSession } from "./store/scamStore"

function readPage(): AppPage {
	const raw = new URLSearchParams(window.location.search).get("page")
	return raw && (APP_PAGES as readonly string[]).includes(raw) ? (raw as AppPage) : "overview"
}

function writePage(page: AppPage) {
	const url = new URL(window.location.href)
	url.searchParams.set("page", page)
	const next = `${url.pathname}${url.search}${url.hash}`
	const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
	if (next !== current) {
		window.history.pushState({ page }, "", next)
	}
}

function AppTree() {
	const [page, setPage] = useState<AppPage>(readPage)
	useLiveSession()

	useEffect(() => {
		const onPop = () => setPage(readPage())
		window.addEventListener("popstate", onPop)
		return () => window.removeEventListener("popstate", onPop)
	}, [])

	return (
		<AppShell
			page={page}
			onNavigate={(next) => {
				writePage(next)
				setPage(next)
			}}
		/>
	)
}

export function App() {
	return (
		<ScamProvider>
			<AppTree />
		</ScamProvider>
	)
}
