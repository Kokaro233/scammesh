export function healthPayload() {
	return {
		ok: true,
		service: "scammesh",
		phase: 2,
		mockInferenceMode: process.env.MOCK_INFERENCE_MODE === "true",
	}
}
