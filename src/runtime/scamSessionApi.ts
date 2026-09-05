import type { defineRuntime } from "@mozaik-ai/core"
import type { InferenceProvider } from "../inference/provider"
import type { ScamRuntimeState } from "./scamSessionState"

type RuntimeApi = ReturnType<typeof defineRuntime<ScamRuntimeState>>

export type ScamSessionApi = Pick<RuntimeApi, "runLoop" | "sendEvent" | "resolveRuntime"> & {
	inference: InferenceProvider
}
