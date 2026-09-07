import type { AddressInfo } from "node:net"
import { afterEach, describe, expect, it } from "vitest"
import { loopsOverlap } from "../../runtime/createScamEnvironment"
import { EVENT_TYPES } from "../../runtime/events"
import { createApp } from "../app"
import { createSimulationController } from "./controller"

function wait(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

describe("live simulation controller", () => {
	const controllers: ReturnType<typeof createSimulationController>[] = []

	afterEach(() => {
		for (const controller of controllers) {
			controller.reset()
		}
		controllers.length = 0
	})

	function live() {
		const controller = createSimulationController()
		controllers.push(controller)
		return controller
	}

	it("starts all six agents together and keeps at least two running", () => {
		const controller = live()
		const view = controller.start({ scenarioId: "bank-impersonation", speed: 40 })
		const running = view.agents.filter((agent) => agent.status === "RUNNING").length
		expect(view.agents).toHaveLength(6)
		expect(running).toBeGreaterThanOrEqual(2)
		expect(loopsOverlap(view.loops.call, view.loops.message) || running >= 2).toBe(true)
	})

	it("replays the main scenario after reset with the same semantic event types", async () => {
		const controller = live()
		controller.start({ scenarioId: "bank-impersonation", speed: 40 })
		await wait(1_200)
		const first = controller
			.view()
			.session.events.map((event) => event.type)
			.sort()
		expect(first).toContain(EVENT_TYPES.COERCION_DETECTED)
		expect(first).toContain(EVENT_TYPES.SUSPICIOUS_LINK_DETECTED)
		expect(first).toContain(EVENT_TYPES.REMOTE_CONTROL_DETECTED)
		expect(first).toContain(EVENT_TYPES.NEW_BENEFICIARY_DETECTED)

		controller.reset()
		expect(controller.view().status).toBe("idle")
		expect(controller.view().session.events).toEqual([])

		controller.start({ scenarioId: "bank-impersonation", speed: 40 })
		await wait(1_200)
		const second = controller
			.view()
			.session.events.map((event) => event.type)
			.sort()
		expect(new Set(second)).toEqual(new Set(first))
	})

	it("turns semantic events, adaptations, and risk snapshots into UI events", async () => {
		const controller = live()
		const received: string[] = []
		const unsubscribe = controller.subscribe((event) => {
			received.push(event.kind)
		})
		controller.start({ scenarioId: "bank-impersonation", speed: 40 })
		await wait(1_200)
		unsubscribe()

		expect(received).toContain("started")
		expect(received).toContain("observation")
		expect(received).toContain("semantic_event")
		expect(received).toContain("adaptation")
		expect(received).toContain("risk_escalation")
		expect(received).toContain("finished")
	})

	it("drops SSE listeners on unsubscribe so reset cannot leak them", () => {
		const controller = live()
		const first = controller.subscribe(() => undefined)
		const second = controller.subscribe(() => undefined)
		expect(controller.listenerCount()).toBe(2)
		first()
		controller.reset()
		expect(controller.listenerCount()).toBe(1)
		second()
		expect(controller.listenerCount()).toBe(0)
	})

	it("pauses feed inject without disposing the session and resumes the same session", async () => {
		const controller = live()
		const started = controller.start({ scenarioId: "bank-impersonation", speed: 20 })
		const sessionId = started.session.sessionId
		expect(started.status).toBe("running")

		const paused = controller.pause()
		expect(paused.status).toBe("paused")
		expect(paused.session.sessionId).toBe(sessionId)

		const resumed = controller.resume()
		expect(resumed.status).toBe("running")
		expect(resumed.session.sessionId).toBe(sessionId)
	})

	it("exposes start, pause, resume, and reset over HTTP", async () => {
		const controller = live()
		const app = createApp(controller)
		const server = app.listen(0)
		const port = (server.address() as AddressInfo).port

		const started = await fetch(`http://127.0.0.1:${port}/api/simulation/start`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ scenarioId: "benign-bank", speed: 40, identityDelay: true }),
		})
		expect(started.ok).toBe(true)
		const body = (await started.json()) as { agents: unknown[]; status: string }
		expect(body.agents).toHaveLength(6)
		expect(body.status).toBe("running")

		const paused = await fetch(`http://127.0.0.1:${port}/api/simulation/pause`, { method: "POST" })
		expect(((await paused.json()) as { status: string }).status).toBe("paused")

		const resumed = await fetch(`http://127.0.0.1:${port}/api/simulation/resume`, { method: "POST" })
		expect(((await resumed.json()) as { status: string }).status).toBe("running")

		const state = (await (await fetch(`http://127.0.0.1:${port}/state`)).json()) as { status: string }
		expect(state.status).toBe("running")

		const health = (await (await fetch(`http://127.0.0.1:${port}/health`)).json()) as {
			inferenceMode: string
			mozaikRuntime: string
			agentCount: number
		}
		expect(health.mozaikRuntime).toBe("active")
		expect(health.agentCount).toBe(6)
		expect(["mock", "live"]).toContain(health.inferenceMode)

		await fetch(`http://127.0.0.1:${port}/reset`, { method: "POST" })
		await new Promise<void>((resolve, reject) => {
			server.close((error) => {
				if (error) {
					reject(error)
					return
				}
				resolve()
			})
		})
	})
})
