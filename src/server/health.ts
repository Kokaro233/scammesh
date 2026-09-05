export function healthPayload() {
	return {
		ok: true,
		service: "scammesh",
		phase: 1,
		mockInferenceMode: process.env.MOCK_INFERENCE_MODE === "true",
	}
}
