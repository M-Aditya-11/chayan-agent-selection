import { TASK_MAP } from "./taskMap.js";

/**
 * selectAgents
 *
 * Accepts an intent object from the upstream intent router.
 * Returns a structured agent_selection_output for Layer-2 (Sūtradhāra).
 *
 * @param {{ actor: string, action: string, context: { task: string } }} intent
 * @returns {{ actor: string, action: string, agents: string[], sequence: string[], context: object }}
 */
export function selectAgents(intent) {
  const { actor, action, context = {} } = intent;
  const agents = TASK_MAP[context.task] ?? [];

  return {
    actor,
    action,
    agents,
    sequence: [...agents],
    context,
  };
}
