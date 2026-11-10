// Every call to the model goes through here, so the on-screen status card can say what is happening
// in human words: "Thinking…" while the model works, then what the agent is doing.
import type { ActResult, ExtractResult, ObserveResult, StagehandClientExtractOptions } from "@browserbasehq/stagehand";
import type { z } from "zod";
import { status } from "../overlay";
import type { System } from "../browser";

/** Show a human description of the step before a model call, then the outcome after it. */
async function withStatus<T>(s: System, busy: string, done: string, fn: () => Promise<T>): Promise<T> {
  await status(s, busy, done, true);
  try {
    return await fn();
  } finally {
    await status(s, done, "", false);
  }
}

export function act(s: System, instruction: string, what: string): Promise<ActResult> {
  return withStatus<ActResult>(s, "Thinking…", what, () => s.stagehand.act(instruction));
}

export function observe(s: System, instruction: string, what: string): Promise<ObserveResult> {
  return withStatus<ObserveResult>(s, "Looking at the page…", what, () => s.stagehand.observe(instruction));
}

export function extract<Schema extends z.ZodType>(
  s: System,
  instruction: string,
  schema: Schema,
  options?: StagehandClientExtractOptions,
): Promise<ExtractResult<Schema>> {
  return withStatus<ExtractResult<Schema>>(s, "Reading the page…", instruction.split("\n")[0] ?? "", () =>
    s.stagehand.extract(instruction, schema, options),
  );
}
