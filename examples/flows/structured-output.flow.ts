import { acp, compute, defineFlow, parseStrictJsonObject, shell } from "acpx/flows";

const PARITY_SCHEMA = {
  type: "object",
  properties: {
    observedSecond: {
      type: "integer",
      minimum: 0,
      maximum: 59,
    },
    parity: {
      type: "string",
      enum: ["odd", "even"],
    },
    basis: {
      type: "string",
    },
  },
  required: ["observedSecond", "parity", "basis"],
  additionalProperties: false,
};

type TimeObservation = {
  observedSecond: number;
  parity: "odd" | "even";
};

export default defineFlow({
  name: "example-structured-output",
  permissions: {
    requiredMode: "approve-all",
    requireExplicitGrant: true,
    reason: "The welcome step invites the agent to run a time command if tools are available.",
  },
  startAt: "welcome",
  nodes: {
    welcome: acp({
      session: {
        isolated: true,
      },
      async prompt() {
        return [
          "Welcome! This flow demonstrates mixing plain text and structured ACP output.",
          "Reply in ordinary plain text.",
          "If shell or terminal tools are available, run a simple current-time command such as `date +%S` and mention the seconds value you observed.",
          "Keep the final visible answer to one or two friendly sentences.",
        ].join("\n");
      },
      statusDetail: "Plain-text welcome turn",
    }),
    observe_time: shell({
      async exec() {
        return {
          command: process.execPath,
          args: [
            "-e",
            [
              "const second = new Date().getSeconds();",
              "process.stdout.write(JSON.stringify({",
              "observedSecond: second,",
              "parity: second % 2 === 0 ? 'even' : 'odd'",
              "}));",
            ].join(""),
          ],
        };
      },
      parse(result) {
        return parseStrictJsonObject(result.stdout);
      },
      statusDetail: "Observe current seconds deterministically",
    }),
    classify_time: acp({
      session: {
        isolated: true,
      },
      structuredOutput: {
        schema: PARITY_SCHEMA,
      },
      async prompt({ outputs }) {
        const observation = outputs.observe_time as TimeObservation;
        return JSON.stringify({
          observedSecond: observation.observedSecond,
          parity: observation.parity,
          basis: "The observed seconds value is divisible by 2 or not.",
        });
      },
      parse(text) {
        return parseStrictJsonObject(text);
      },
      statusDetail: "Structured-output ACP turn",
    }),
    follow_up: acp({
      session: {
        isolated: true,
      },
      async prompt({ outputs }) {
        return [
          "Switch back to ordinary plain text.",
          "In one short sentence, explain what the previous structured JSON result said.",
          "",
          `Structured result: ${JSON.stringify(outputs.classify_time)}`,
        ].join("\n");
      },
      statusDetail: "Plain-text follow-up turn",
    }),
    finalize: compute({
      run: ({ outputs }) => ({
        welcome: outputs.welcome,
        observedTime: outputs.observe_time,
        structured: outputs.classify_time,
        followUp: outputs.follow_up,
      }),
    }),
  },
  edges: [
    { from: "welcome", to: "observe_time" },
    { from: "observe_time", to: "classify_time" },
    { from: "classify_time", to: "follow_up" },
    { from: "follow_up", to: "finalize" },
  ],
});
