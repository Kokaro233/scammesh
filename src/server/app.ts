import path from "node:path"
import express from "express"
import { healthPayload } from "./health"
import { createSimulationController } from "./simulation/controller"
import { registerSimulationRoutes } from "./simulation/routes"

const uiDist = path.resolve(process.cwd(), "dist/ui")

export function createApp(controller = createSimulationController()) {
	const app = express()
	app.use(express.json())
	app.get("/health", (_req, res) => {
		res.json(healthPayload())
	})
	registerSimulationRoutes(app, controller)

	app.use(express.static(uiDist, { index: false, fallthrough: true }))
	app.get(/^(?!\/api(?:\/|$)|\/health$|\/state$|\/reset$).*/, (_req, res, next) => {
		res.sendFile(path.join(uiDist, "index.html"), (error) => {
			if (error) {
				next()
			}
		})
	})

	return app
}
