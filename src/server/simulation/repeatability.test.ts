import { afterEach, describe, expect, it } from "vitest"
import { EVENT_TYPES } from "../../runtime/events"
import { SCENARIO_IDS, type ScenarioId } from "../../shared/types"
import type { UiEvent } from "../../shared/uiEvents"
import { createSimulationController } from "./controller"

function wait(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

async function waitUntilSettled(
	controller: ReturnType<typeof createSimulationController>,
	timeoutMs: number,
) {
	const started = Date.now()
	while (Date.now() - started < timeoutMs) {
		if (controller.view().status === "finished") {
			await wait(220)
			return controller.view()
		}
		await wait(40)
	}
	return controller.view()
}

describe("simulation repeatability and reset", () => {
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

	it(
		"replays all three scenarios after reset without stacking events",
		async () => {
			const controller = live()
			const budgets: Record<ScenarioId, number> = {
				"bank-impersonation": 1_600,
				"benign-bank": 900,
				ambiguous: 1_000,
			}

			for (const scenarioId of SCENARIO_IDS) {
				controller.start({ scenarioId, speed: 40 })
				const first = await waitUntilSettled(controller, budgets[scenarioId])
				const firstTypes = first.session.events.map((event) => event.type).sort()
				expect(first.agents).toHaveLength(6)
				expect(first.status).toBe("finished")

				if (scenarioId === "benign-bank" || scenarioId === "ambiguous") {
					expect(first.session.riskLevel).not.toBe("CRITICAL")
				}

				controller.reset()
				expect(controller.view().status).toBe("idle")
				expect(controller.view().session.events).toEqual([])

				controller.start({ scenarioId, speed: 40 })
				const second = await waitUntilSettled(controller, budgets[scenarioId])
				expect(new Set(second.session.events.map((event) => event.type))).toEqual(new Set(firstTypes))
				controller.reset()
			}
		},
		20_000,
	)

	it("keeps a single listener across three start/reset cycles", async () => {
		const controller = live()
		const received: UiEvent[] = []
		const unsubscribe = controller.subscribe((event) => {
			received.push(event)
		})

		for (let cycle = 0; cycle < 3; cycle += 1) {
			received.length = 0
			controller.start({ scenarioId: "benign-bank", speed: 40 })
			await waitUntilSettled(controller, 900)
			expect(controller.listenerCount()).toBe(1)
			expect(received.filter((event) => event.kind === "started")).toHaveLength(1)
			expect(received.filter((event) => event.kind === "finished")).toHaveLength(1)

			controller.reset()
			expect(controller.listenerCount()).toBe(1)
			expect(controller.view().session.events).toEqual([])
		}

		unsubscribe()
		expect(controller.listenerCount()).toBe(0)
	}, 10_000)

	it("proves a cross-agent adaptation on the main scenario", async () => {
		const controller = live()
		controller.start({ scenarioId: "bank-impersonation", speed: 40 })
		const view = await waitUntilSettled(controller, 1_600)
		const callToMessage = view.session.adaptations.find(
			(item) => item.sourceAgent === "call" && item.targetAgent === "message",
		)

		expect(callToMessage).toMatchObject({
			triggerEvent: EVENT_TYPES.COERCION_DETECTED,
			beforeMode: "NORMAL",
			afterMode: "HEIGHTENED",
		})
		expect(view.session.events.some((event) => event.type === EVENT_TYPES.SUSPICIOUS_LINK_DETECTED)).toBe(true)
	})

	it("does not leave unhandled rejections after a full main-scenario run", async () => {
		const controller = live()
		const rejections: unknown[] = []
		const onReject = (reason: unknown) => {
			rejections.push(reason)
		}
		process.on("unhandledRejection", onReject)

		try {
			controller.start({ scenarioId: "bank-impersonation", speed: 40 })
			await waitUntilSettled(controller, 1_600)
			await wait(50)
			expect(rejections).toEqual([])
			expect(controller.view().status).toBe("finished")
		} finally {
			process.off("unhandledRejection", onReject)
		}
	})
})
