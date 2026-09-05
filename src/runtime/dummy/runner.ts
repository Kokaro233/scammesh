import {
	ModelMessageItem,
	SemanticEvent,
	UserMessageItem,
	type InferenceInput,
	type InferenceOutput,
	type InferenceRunner,
} from "@mozaik-ai/core"

function delay(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

export class DelayedMockInferenceRunner implements InferenceRunner {
	constructor(private readonly delayByModel: Record<string, number>) {}

	async run(input: InferenceInput): Promise<InferenceOutput> {
		await delay(this.delayByModel[input.model] ?? 20)

		const lastUserMessage = [...input.context.getItems()].reverse().find((item) => item instanceof UserMessageItem)
		const text = lastUserMessage
			? `Mock reply (no provider called). You said: "${lastUserMessage.content.text}"`
			: "Mock reply (no provider called). There was no user message in context."

		return {
			items: [ModelMessageItem.rehydrate({ text })],
			tokenUsage: undefined,
			rowResponse: { mock: true, model: input.model },
		}
	}

	async *stream(input: InferenceInput): AsyncGenerator<SemanticEvent> {
		yield SemanticEvent.create("inference.output", input.model, await this.run(input))
	}
}
