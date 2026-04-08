import { runPipeline } from "./src/pipeline.js";

const TS = "2025-01-01T00:00:00.000Z";

const intents = [
  { actor: "intent-router", action: "task.route", context: { task: "summarize-and-format" } },
  { actor: "intent-router", action: "task.route", context: { task: "classify-and-format" } },
  { actor: "intent-router", action: "task.route", context: { task: "unknown.task" } },
];

intents.forEach(i => {
  console.log(JSON.stringify(runPipeline(i, { _timestamp: TS }).proposal, null, 2));
  console.log("---");
});
