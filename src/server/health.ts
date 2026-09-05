export function healthPayload() {
	return {
		ok: true,
		service: "scammesh",
		phase: 0,
		mockInferenceMode: process.env.MOCK_INFERENCE_MODE === "true",
	}
}
