/**
 * NOTE: The registry, validateStructure, and buildActionProposal below are
 * intentional inline copies for demo/replay purposes only.
 * They mirror agent-sandbox exactly. When cross-repo imports are available,
 * replace with direct imports from Sūtradhāra.
 */

import { selectAgents } from "./selectAgents.js";

// ─── Inline registry (mirrors agent-sandbox AgentRegistry) ───────────────────

const REGISTRY = [
  { id: 1, name: "Text Summarizer",     lifecycle_state: "Active" },
  { id: 2, name: "Data Formatter",      lifecycle_state: "Active" },
  { id: 3, name: "Risk Evaluator",      lifecycle_state: "Active" },
  { id: 4, name: "Document Classifier", lifecycle_state: "Suspended" },
  { id: 5, name: "Language Translator", lifecycle_state: "Active" },
  { id: 6, name: "Workflow Router",     lifecycle_state: "Active" },
];

function getAgentById(id) {
  const normalized = typeof id === "string" ? Number(id) : id;
  return REGISTRY.find((a) => a.id === normalized) ?? null;
}

// ─── Inline StructuralValidator ───────────────────────────────────────────────

const FORBIDDEN_CHAINS = [[3, 1], [6, 2]];

function validateStructure(resolvedAgents = []) {
  const errors = [];

  for (const agent of resolvedAgents) {
    if (agent.lifecycle_state === "Suspended") {
      errors.push({ code: "AGENT_SUSPENDED", message: `Suspended agent detected: ${agent.id}` });
    }
  }

  const ids = resolvedAgents.map((a) => a.id);
  if (new Set(ids).size !== ids.length) {
    errors.push({ code: "DUPLICATE_AGENTS", message: "Duplicate agents detected" });
  }

  for (let i = 0; i < resolvedAgents.length - 1; i++) {
    for (const [from, to] of FORBIDDEN_CHAINS) {
      if (resolvedAgents[i].id === from && resolvedAgents[i + 1].id === to) {
        errors.push({
          code: "INVALID_CHAIN",
          message: `Invalid chaining: ${resolvedAgents[i].name} cannot precede ${resolvedAgents[i + 1].name}`,
        });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── Inline buildActionProposal (mirrors agent-sandbox) ──────────────────────

const CONTRACT_VERSION = "v1.1";

function generateProposalId({ actor, action, agents, context }) {
  const payload = JSON.stringify({ actor, action, agents, context });
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "ap-" + Math.abs(hash).toString(16);
}

function buildFailure(stage, codes, message) {
  return { stage, codes, message };
}

function buildActionProposal({ actor, action, agents, context = {}, _timestamp } = {}) {
  const proposal_id = generateProposalId({ actor, action, agents, context });
  const timestamp   = _timestamp ?? new Date().toISOString();

  const base = {
    proposal_id,
    timestamp,
    contract_version: CONTRACT_VERSION,
    actor, action, agents,
    sequence: [...agents],
    context,
  };

  if (agents.length === 0) {
    return {
      ...base,
      constraints: { lifecycle_valid: false },
      failure: buildFailure("EMPTY_CHAIN", ["EMPTY_AGENT_CHAIN"], "No agents provided — an empty chain cannot be executed"),
      governance_request: null,
    };
  }

  const resolved = agents.map((id) => getAgentById(id));

  if (resolved.includes(null)) {
    return {
      ...base,
      constraints: { lifecycle_valid: false },
      failure: buildFailure("REGISTRY_RESOLUTION", ["AGENT_NOT_FOUND"], "One or more agent IDs could not be resolved in the registry"),
      governance_request: null,
    };
  }

  const validation = validateStructure(resolved);

  if (!validation.valid) {
    const codes   = validation.errors.map((e) => e.code);
    const message = validation.errors.map((e) => e.message).join("; ");
    return {
      ...base,
      constraints: { lifecycle_valid: false },
      failure: buildFailure("STRUCTURAL_VALIDATION", codes, message),
      governance_request: null,
    };
  }

  return {
    ...base,
    constraints: { lifecycle_valid: true },
    failure: null,
    governance_request: { actor, action, resource: agents, context },
  };
}

// ─── runPipeline ──────────────────────────────────────────────────────────────

/**
 * Runs the full pipeline for a single intent.
 * Returns a structured log: { intent, selection, proposal }
 *
 * @param {{ actor: string, action: string, context: { task: string } }} intent
 * @param {{ _timestamp?: string }} options — inject fixed timestamp for replay tests
 * @returns {{ intent: object, selection: object, proposal: object }}
 */
export function runPipeline(intent, { _timestamp } = {}) {
  const selection = selectAgents(intent);
  const proposal  = buildActionProposal({ ...selection, _timestamp });
  return { intent, selection, proposal };
}
