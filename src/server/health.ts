export function healthPayload() {
	return {
		ok: true,
		service: "scammesh",
		phase: 5,
		mockInferenceMode: process.env.MOCK_INFERENCE_MODE === "true",
	}
}
