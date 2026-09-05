import type { Express, Response } from "express"
import { loadAllScenarios } from "../../scenarios/loadScenario"
import type { ScenarioId } from "../../shared/types"
import type { SimulationController } from "./controller"

function writeSse(res: Response, event: unknown) {
	res.write(`data: ${JSON.stringify(event)}\n\n`)
}

export function registerSimulationRoutes(app: Express, controller: SimulationController) {
	const start = (req: { body?: { scenarioId?: ScenarioId; speed?: number } }, res: Response) => {
		try {
			res.json(controller.start(req.body ?? {}))
		} catch (error) {
			res.status(400).json({ ok: false, message: error instanceof Error ? error.message : "start failed" })
		}
	}

	const reset = (_req: unknown, res: Response) => {
		res.json(controller.reset())
	}

	const state = (_req: unknown, res: Response) => {
		res.json(controller.view())
	}

	app.post("/api/simulation/start", start)
	app.post("/api/simulation/pause", (_req, res) => {
		res.json(controller.pause())
	})
	app.post("/api/simulation/reset", reset)
	app.post("/reset", reset)
	app.get("/api/simulation/state", state)
	app.get("/state", state)
	app.get("/api/scenarios", (_req, res) => {
		res.json({
			scenarios: loadAllScenarios().map((scenario) => ({
				id: scenario.id,
				title: scenario.title,
				summary: scenario.summary,
			})),
		})
	})
	app.get("/api/events", (req, res) => {
		res.setHeader("Content-Type", "text/event-stream")
		res.setHeader("Cache-Control", "no-cache")
		res.setHeader("Connection", "keep-alive")
		res.flushHeaders?.()
		res.write(": connected\n\n")

		const unsubscribe = controller.subscribe((event) => {
			writeSse(res, event)
		})

		req.on("close", () => {
			unsubscribe()
		})
	})
}
