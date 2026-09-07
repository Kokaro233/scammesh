import "dotenv/config"
import { createApp } from "./app"

const port = Number(process.env.PORT ?? 3000)

process.on("uncaughtException", (error) => {
	console.error("uncaughtException", error)
})
process.on("unhandledRejection", (reason) => {
	console.error("unhandledRejection", reason)
})

try {
	const app = createApp()
	app.listen(port, "0.0.0.0", () => {
		console.log(`ScamMesh listening on 0.0.0.0:${port}`)
	})
} catch (error) {
	console.error("failed to boot ScamMesh", error)
	process.exit(1)
}
