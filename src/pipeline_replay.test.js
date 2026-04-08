/**
 * pipeline_replay.test.js
 *
 * Proves replayability beyond doubt.
 * Same intent → identical proposal_id, identical structure, identical failure.
 *
 * Every scenario is run REPLAY_RUNS times.
 * Assertions go beyond byte comparison — each field is verified independently.
 */

import { describe, it, expect } from "vitest";
import { runPipeline } from "./pipeline.js";

const REPLAY_RUNS  = 20;
const FIXED_TS     = "2025-01-01T00:00:00.000Z";

function run(intent) {
  return runPipeline(intent, { _timestamp: FIXED_TS });
}

function replayAll(intent) {
  return Array.from({ length: REPLAY_RUNS }, () => run(intent));
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function allEqual(runs, extract) {
  const values = runs.map(extract);
  return values.every((v) => JSON.stringify(v) === JSON.stringify(values[0]));
}

// ─── RPT-01  Valid chain — proposal_id identical ──────────────────────────────

describe("RPT-01 — valid chain: proposal_id is identical across all runs", () => {
  it(`same across ${REPLAY_RUNS} runs`, () => {
    const runs = replayAll({ actor: "intent-router", action: "task.route", context: { task: "summarize-and-format" } });

    expect(allEqual(runs, (r) => r.proposal.proposal_id)).toBe(true);
    expect(runs[0].proposal.proposal_id).toMatch(/^ap-/);
  });
});

// ─── RPT-02  Valid chain — full structure identical ───────────────────────────

describe("RPT-02 — valid chain: full proposal structure identical across all runs", () => {
  it(`byte-identical across ${REPLAY_RUNS} runs`, () => {
    const runs = replayAll({ actor: "intent-router", action: "task.route", context: { task: "summarize-and-format" } });

    expect(allEqual(runs, (r) => r.proposal)).toBe(true);
  });
});

// ─── RPT-03  Valid chain — governance_request identical ──────────────────────

describe("RPT-03 — valid chain: governance_request identical across all runs", () => {
  it(`same resource, actor, action across ${REPLAY_RUNS} runs`, () => {
    const runs = replayAll({ actor: "intent-router", action: "task.route", context: { task: "evaluate-and-route" } });

    expect(allEqual(runs, (r) => r.proposal.governance_request)).toBe(true);
    expect(runs[0].proposal.governance_request.resource).toEqual(["3", "6"]);
  });
});

// ─── RPT-04  Valid chain — selection_metadata identical ──────────────────────

describe("RPT-04 — valid chain: selection_metadata identical across all runs", () => {
  it(`source, confidence, fallback_used same across ${REPLAY_RUNS} runs`, () => {
    const runs = replayAll({ actor: "intent-router", action: "task.route", context: { task: "translate-and-summarize" } });

    expect(allEqual(runs, (r) => r.selection.selection_metadata)).toBe(true);
    expect(runs[0].selection.selection_metadata).toEqual({
      source: "taskMap",
      confidence: "deterministic",
      fallback_used: false,
    });
  });
});

// ─── RPT-05  Suspended agent — failure identical ──────────────────────────────

describe("RPT-05 — suspended agent: failure object identical across all runs", () => {
  it(`stage, codes, message same across ${REPLAY_RUNS} runs`, () => {
    const runs = replayAll({ actor: "intent-router", action: "task.route", context: { task: "classify-and-format" } });

    expect(allEqual(runs, (r) => r.proposal.failure)).toBe(true);
    expect(runs[0].proposal.failure).toEqual({
      stage: "STRUCTURAL_VALIDATION",
      codes: ["AGENT_SUSPENDED"],
      message: "Suspended agent detected: 4",
    });
    expect(allEqual(runs, (r) => r.proposal.governance_request)).toBe(true);
    expect(runs[0].proposal.governance_request).toBeNull();
  });
});

// ─── RPT-06  Empty chain — failure identical ─────────────────────────────────

describe("RPT-06 — empty chain: failure object identical across all runs", () => {
  it(`EMPTY_CHAIN failure same across ${REPLAY_RUNS} runs`, () => {
    const runs = replayAll({ actor: "intent-router", action: "task.route", context: { task: "unknown.task" } });

    expect(allEqual(runs, (r) => r.proposal.failure)).toBe(true);
    expect(runs[0].proposal.failure).toEqual({
      stage: "EMPTY_CHAIN",
      codes: ["EMPTY_AGENT_CHAIN"],
      message: "No agents provided — an empty chain cannot be executed",
    });
    expect(runs[0].proposal.governance_request).toBeNull();
  });
});

// ─── RPT-07  proposal_id differs for different inputs ────────────────────────

describe("RPT-07 — different intents produce different proposal_ids", () => {
  it("proposal_id is input-scoped, not global", () => {
    const a = run({ actor: "intent-router", action: "task.route", context: { task: "summarize-and-format" } });
    const b = run({ actor: "intent-router", action: "task.route", context: { task: "evaluate-and-route" } });
    const c = run({ actor: "intent-router", action: "task.route", context: { task: "classify-and-format" } });

    expect(a.proposal.proposal_id).not.toBe(b.proposal.proposal_id);
    expect(b.proposal.proposal_id).not.toBe(c.proposal.proposal_id);
    expect(a.proposal.proposal_id).not.toBe(c.proposal.proposal_id);
  });
});

// ─── RPT-08  contract_version identical across all runs ──────────────────────

describe("RPT-08 — contract_version is stable across all runs", () => {
  it(`always v1.1 across ${REPLAY_RUNS} runs`, () => {
    const runs = replayAll({ actor: "intent-router", action: "task.route", context: { task: "summarize-and-format" } });

    expect(allEqual(runs, (r) => r.proposal.contract_version)).toBe(true);
    expect(runs[0].proposal.contract_version).toBe("v1.1");
  });
});

// ─── RPT-09  timestamp is injected, not live ─────────────────────────────────

describe("RPT-09 — timestamp is the injected value, not live clock", () => {
  it(`all runs carry FIXED_TS across ${REPLAY_RUNS} runs`, () => {
    const runs = replayAll({ actor: "intent-router", action: "task.route", context: { task: "summarize-and-format" } });

    expect(allEqual(runs, (r) => r.proposal.timestamp)).toBe(true);
    expect(runs[0].proposal.timestamp).toBe(FIXED_TS);
  });
});
