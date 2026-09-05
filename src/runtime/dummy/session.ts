import type { defineRuntime } from "@mozaik-ai/core"
import type { DummyRuntimeState } from "./state"

type RuntimeApi = ReturnType<typeof defineRuntime<DummyRuntimeState>>

export type DummySessionApi = Pick<RuntimeApi, "runLoop" | "sendEvent" | "resolveRuntime">
