import express from "express"
import { healthPayload } from "./health"

export function createApp() {
	const app = express()
	app.get("/health", (_req, res) => {
		res.json(healthPayload())
	})
	return app
}
