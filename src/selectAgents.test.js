import { describe, it, expect } from "vitest";
import { selectAgents } from "./selectAgents.js";

function base(overrides = {}) {
  return {
    actor: "intent-router",
    action: "task.route",
    context: { task: "summarize-and-format" },
    ...overrides,
  };
}

// ─── TC-01  Known task — summarize-and-format ────────────────────────────────

describe("TC-01 — summarize-and-format maps to agents [1, 2]", () => {
  it("returns correct agents and sequence", () => {
    const output = selectAgents(base());

    expect(output.agents).toEqual(["1", "2"]);
    expect(output.sequence).toEqual(["1", "2"]);
  });
});

// ─── TC-02  Known task — evaluate-and-route ──────────────────────────────────

describe("TC-02 — evaluate-and-route maps to agents [3, 6]", () => {
  it("returns correct agents and sequence", () => {
    const output = selectAgents(base({ context: { task: "evaluate-and-route" } }));

    expect(output.agents).toEqual(["3", "6"]);
    expect(output.sequence).toEqual(["3", "6"]);
  });
});

// ─── TC-03  Known task — translate-and-summarize ─────────────────────────────

describe("TC-03 — translate-and-summarize maps to agents [5, 1]", () => {
  it("returns correct agents and sequence", () => {
    const output = selectAgents(base({ context: { task: "translate-and-summarize" } }));

    expect(output.agents).toEqual(["5", "1"]);
    expect(output.sequence).toEqual(["5", "1"]);
  });
});

// ─── TC-04  Unknown task — empty agents ──────────────────────────────────────

describe("TC-04 — unknown task returns empty agents and sequence", () => {
  it("returns empty arrays, does not throw", () => {
    const output = selectAgents(base({ context: { task: "unknown.task" } }));

    expect(output.agents).toEqual([]);
    expect(output.sequence).toEqual([]);
  });
});

// ─── TC-05  Output shape ─────────────────────────────────────────────────────

describe("TC-05 — output always contains all required fields", () => {
  it("returns actor, action, agents, sequence, context", () => {
    const output = selectAgents(base());

    expect(output).toHaveProperty("actor", "intent-router");
    expect(output).toHaveProperty("action", "task.route");
    expect(Array.isArray(output.agents)).toBe(true);
    expect(Array.isArray(output.sequence)).toBe(true);
    expect(typeof output.context).toBe("object");
  });
});

// ─── TC-06  sequence is independent copy of agents ───────────────────────────

describe("TC-06 — sequence is an independent copy of agents", () => {
  it("mutating agents does not affect sequence", () => {
    const output = selectAgents(base());
    const sequenceBefore = [...output.sequence];

    output.agents.push("99");

    expect(output.sequence).toEqual(sequenceBefore);
  });
});
