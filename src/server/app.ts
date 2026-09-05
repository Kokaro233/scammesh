import express from "express"
import { healthPayload } from "./health"
import { createSimulationController } from "./simulation/controller"
import { registerSimulationRoutes } from "./simulation/routes"

export function createApp(controller = createSimulationController()) {
	const app = express()
	app.use(express.json())
	app.get("/health", (_req, res) => {
		res.json(healthPayload())
	})
	registerSimulationRoutes(app, controller)
	return app
}
