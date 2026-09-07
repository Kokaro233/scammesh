import { describe, expect, it } from "vitest"
import { classifyLink, detourPoint, edgePoint, layoutMesh, linkStroke, pathClearsBox, routeWaypoints, segmentHitsBox } from "./meshGeometry"

const topLeft = { x: 0, y: 0, w: 200, h: 90 }
const topRight = { x: 600, y: 0, w: 200, h: 90 }
const left = { x: 0, y: 180, w: 180, h: 100 }
const right = { x: 620, y: 180, w: 180, h: 100 }
const lowLeft = { x: 0, y: 420, w: 180, h: 100 }
const receipt = { x: 260, y: 90, w: 180, h: 280 }

describe("meshGeometry", () => {
	it("docks a line to the slip edge, not the center", () => {
		const point = edgePoint(topLeft, { x: 700, y: 45 })
		expect(point.x).toBeGreaterThan(190)
		expect(point.x).toBeLessThan(220)
	})

	it("keeps a clear top link off the receipt", () => {
		const stroke = linkStroke(topLeft, topRight, receipt)
		expect(segmentHitsBox({ x: 100, y: 45 }, { x: 700, y: 45 }, receipt)).toBe(false)
		expect(stroke.d.startsWith("M ")).toBe(true)
		expect(stroke.to.x - stroke.from.x).toBeGreaterThan(350)
		expect(stroke.my).toBeLessThan(receipt.y)
	})

	it("keeps opposite-side links on the top or bottom gutter", () => {
		const via = detourPoint({ x: 90, y: 230 }, { x: 710, y: 90 }, receipt)
		expect(via.y < receipt.y || via.y > receipt.y + receipt.h).toBe(true)
	})

	it("routes a crossing link around the receipt", () => {
		expect(segmentHitsBox({ x: 90, y: 230 }, { x: 710, y: 230 }, receipt)).toBe(true)
		const vias = routeWaypoints({ x: 90, y: 230 }, { x: 710, y: 230 }, receipt)
		expect(vias.length).toBeGreaterThan(0)
		expect(pathClearsBox({ x: 90, y: 230 }, vias, { x: 710, y: 230 }, receipt)).toBe(true)
		const stroke = linkStroke(left, right, receipt, { w: 800, h: 560 })
		expect(stroke.d.includes("C") || stroke.d.includes("Q")).toBe(true)
		expect(stroke.my < receipt.y - 10 || stroke.my > receipt.y + receipt.h + 10).toBe(true)
	})

	it("gives same-side links different bows so they do not stack", () => {
		expect(classifyLink(topLeft, lowLeft, receipt)).toBe("left")
		const strokes = layoutMesh(
			[
				{ id: "a", source: topLeft, target: lowLeft },
				{ id: "b", source: left, target: lowLeft },
			],
			receipt,
			{ w: 800, h: 560 },
		)
		expect(strokes.a.d).not.toBe(strokes.b.d)
		expect(Math.abs(strokes.a.mx - strokes.b.mx)).toBeGreaterThan(8)
	})

	it("places the label off the stroke", () => {
		const stroke = linkStroke(left, lowLeft, receipt)
		const onLine = Math.abs(stroke.mx - stroke.from.x) < 2 && stroke.my > stroke.from.y && stroke.my < stroke.to.y
		expect(onLine).toBe(false)
	})

	it("keeps the apex mesh off the receipt and off each other", () => {
		const call = { x: 63, y: 48, w: 200, h: 92 }
		const message = { x: 697, y: 48, w: 200, h: 92 }
		const browser = { x: 50, y: 295, w: 188, h: 110 }
		const device = { x: 722, y: 295, w: 188, h: 110 }
		const identity = { x: 63, y: 548, w: 200, h: 92 }
		const payment = { x: 697, y: 548, w: 200, h: 92 }
		const deskReceipt = { x: 354, y: 161, w: 252, h: 378 }
		const strokes = layoutMesh(
			[
				{ id: "link-call-message", source: call, target: message },
				{ id: "link-message-browser", source: message, target: browser },
				{ id: "link-device-browser", source: device, target: browser },
				{ id: "link-call-identity", source: call, target: identity },
				{ id: "link-browser-identity", source: browser, target: identity },
				{ id: "link-browser-payment", source: browser, target: payment },
				{ id: "link-device-payment", source: device, target: payment },
			],
			deskReceipt,
			{ w: 960, h: 700 },
		)
		const paths = Object.values(strokes).map((item) => item.d)
		expect(new Set(paths).size).toBe(paths.length)
		expect(classifyLink(call, identity, deskReceipt)).toBe("left")
		expect(classifyLink(device, browser, deskReceipt)).toBe("cross")
		expect(strokes["link-device-browser"].my < deskReceipt.y || strokes["link-device-browser"].my > deskReceipt.y + deskReceipt.h).toBe(true)
		expect(strokes["link-browser-identity"].mx).toBeLessThan(deskReceipt.x)
		expect(Math.abs(strokes["link-call-identity"].mx - strokes["link-browser-identity"].mx)).toBeGreaterThan(8)
	})
})
