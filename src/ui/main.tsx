import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"
import "./styles/tokens.css"
import "./styles/shell.css"
import "./styles/product.css"
import "./styles/workspace.css"
import "./styles.css"

const root = document.getElementById("root")

if (!root) {
	throw new Error("Root element #root was not found")
}

createRoot(root).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
