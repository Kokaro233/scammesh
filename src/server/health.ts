export function healthPayload() {
	return {
		ok: true,
		service: "scammesh",
		phase: 10,
		mockInferenceMode: process.env.MOCK_INFERENCE_MODE === "true",
	}
}
