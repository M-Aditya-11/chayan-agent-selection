/**
 * pipeline.demo.js
 *
 * Full pipeline log: intent → selection → proposal
 * Run: node src/pipeline.demo.js
 */

import { runPipeline } from "./pipeline.js";

const MOCK_INTENTS = [
  { actor: "intent-router", action: "task.route", context: { task: "summarize-and-format" } },
  { actor: "intent-router", action: "task.route", context: { task: "evaluate-and-route" } },
  { actor: "intent-router", action: "task.route", context: { task: "translate-and-summarize" } },
  { actor: "intent-router", action: "task.route", context: { task: "classify-and-format" } },
  { actor: "intent-router", action: "task.route", context: { task: "unknown.task" } },
];

for (const intent of MOCK_INTENTS) {
  const { selection, proposal } = runPipeline(intent);

  console.log("─".repeat(60));
  console.log("INTENT    ", JSON.stringify(intent));
  console.log("SELECTION ", JSON.stringify(selection));
  console.log("PROPOSAL  ", JSON.stringify(proposal));
}

console.log("─".repeat(60));
