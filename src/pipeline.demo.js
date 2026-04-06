/**
 * pipeline.demo.js
 *
 * Demonstrates the full flow:
 *   mock intent → Chayan (agent selection) → Sūtradhāra (ActionProposal)
 *
 * Run: node src/pipeline.demo.js
 */

import { selectAgents } from "./selectAgents.js";

// ─── Inline registry (mirrors AgentRegistry in agent-sandbox) ────────────────

const REGISTRY = [
  { id: 1, name: "Text Summarizer",    lifecycle_state: "Active" },
  { id: 2, name: "Data Formatter",     lifecycle_state: "Active" },
  { id: 3, name: "Risk Evaluator",     lifecycle_state: "Active" },
  { id: 4, name: "Document Classifier",lifecycle_state: "Suspended" },
  { id: 5, name: "Language Translator",lifecycle_state: "Active" },
  { id: 6, name: "Workflow Router",    lifecycle_state: "Active" },
];

function getAgentById(id) {
  const normalized = typeof id === "string" ? Number(id) : id;
  return REGISTRY.find((a) => a.id === normalized) ?? null;
}

// ─── Inline StructuralValidator ───────────────────────────────────────────────

const FORBIDDEN_CHAINS = [
  [3, 1],
  [6, 2],
];

const ERROR_CODES = {
  AGENT_SUSPENDED: "AGENT_SUSPENDED",
  DUPLICATE_AGENTS: "DUPLICATE_AGENTS",
  INVALID_CHAIN:    "INVALID_CHAIN",
};

function validateStructure(resolvedAgents = []) {
  const errors = [];

  for (const agent of resolvedAgents) {
    if (agent.lifecycle_state === "Suspended") {
      errors.push({ code: ERROR_CODES.AGENT_SUSPENDED, message: `Suspended agent detected: ${agent.id}` });
    }
  }

  const ids = resolvedAgents.map((a) => a.id);
  if (new Set(ids).size !== ids.length) {
    errors.push({ code: ERROR_CODES.DUPLICATE_AGENTS, message: "Duplicate agents detected" });
  }

  for (let i = 0; i < resolvedAgents.length - 1; i++) {
    for (const [from, to] of FORBIDDEN_CHAINS) {
      if (resolvedAgents[i].id === from && resolvedAgents[i + 1].id === to) {
        errors.push({
          code: ERROR_CODES.INVALID_CHAIN,
          message: `Invalid chaining: ${resolvedAgents[i].name} cannot precede ${resolvedAgents[i + 1].name}`,
        });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── Inline buildActionProposal (Sūtradhāra) ─────────────────────────────────

function buildGovernanceRequest({ actor, action, resource, context }) {
  return { actor, action, resource, context };
}

function buildActionProposal({ actor, action, agents, context = {} }) {
  const resolved = agents.map((id) => getAgentById(id));

  if (resolved.includes(null)) {
    return {
      actor, action, agents,
      sequence: [...agents],
      constraints: { lifecycle_valid: false },
      context,
      governance_request: null,
    };
  }

  const validation = validateStructure(resolved);

  if (!validation.valid) {
    return {
      actor, action, agents,
      sequence: [...agents],
      constraints: { lifecycle_valid: false },
      context,
      governance_request: null,
    };
  }

  return {
    actor, action, agents,
    sequence: [...agents],
    constraints: { lifecycle_valid: true },
    context,
    governance_request: buildGovernanceRequest({ actor, action, resource: agents, context }),
  };
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

const MOCK_INTENTS = [
  { actor: "intent-router", action: "task.route", context: { task: "summarize-and-format" } },
  { actor: "intent-router", action: "task.route", context: { task: "evaluate-and-route" } },
  { actor: "intent-router", action: "task.route", context: { task: "translate-and-summarize" } },
  { actor: "intent-router", action: "task.route", context: { task: "classify-and-format" } },  // suspended agent
  { actor: "intent-router", action: "task.route", context: { task: "unknown.task" } },          // unknown task
];

for (const intent of MOCK_INTENTS) {
  const chayanOutput    = selectAgents(intent);
  const actionProposal  = buildActionProposal(chayanOutput);

  console.log("─".repeat(60));
  console.log("INTENT          ", JSON.stringify(intent.context));
  console.log("CHAYAN OUTPUT   ", JSON.stringify(chayanOutput));
  console.log("ACTION PROPOSAL ", JSON.stringify(actionProposal, null, 2));
}

console.log("─".repeat(60));
