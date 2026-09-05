export function healthPayload() {
	return {
		ok: true,
		service: "scammesh",
		phase: 7,
		mockInferenceMode: process.env.MOCK_INFERENCE_MODE === "true",
	}
}
