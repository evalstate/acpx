import { acp, checkpoint, defineFlow, parseStrictJsonObject } from "acpx/flows";

type BranchInput = {
  task?: string;
};

const CLASSIFY_SCHEMA = {
  type: "object",
  properties: {
    route: {
      type: "string",
      enum: ["continue", "checkpoint"],
      description:
        "Use continue for concrete scoped tasks; use checkpoint for ambiguous tasks that need clarification.",
    },
    reason: {
      type: "string",
      description: "A short explanation for the route.",
    },
  },
  required: ["route", "reason"],
  additionalProperties: false,
};

export default defineFlow({
  name: "example-branch-structured-output",
  startAt: "classify",
  nodes: {
    classify: acp({
      structuredOutput: {
        schema: CLASSIFY_SCHEMA,
      },
      async prompt({ input }) {
        const task =
          (input as BranchInput).task ??
          "Investigate a flaky test and decide whether the request is clear enough to continue.";
        return [
          "Read the task below and classify whether it is concrete enough to continue.",
          "Prefer checkpoint when the task is ambiguous or needs clarification.",
          "",
          `Task: ${task}`,
        ].join("\n");
      },
      parse: (text) => parseStrictJsonObject(text),
    }),
    continue_lane: acp({
      async prompt({ outputs }) {
        return [
          "We are on the continue path.",
          "In one short sentence, explain why this task is ready to continue.",
          "",
          `Classification: ${JSON.stringify(outputs.classify)}`,
        ].join("\n");
      },
    }),
    checkpoint_lane: checkpoint({
      summary: "needs clarification",
      run: ({ outputs }) => ({
        route: "checkpoint",
        summary: (outputs.classify as { reason?: string }).reason ?? "Needs clarification.",
      }),
    }),
  },
  edges: [
    {
      from: "classify",
      switch: {
        on: "$.route",
        cases: {
          continue: "continue_lane",
          checkpoint: "checkpoint_lane",
        },
      },
    },
  ],
});
