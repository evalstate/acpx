import type { AgentCapabilities } from "@agentclientprotocol/sdk";

export type JsonObject = Record<string, unknown>;

export type StructuredOutputRequest = {
  schema: JsonObject;
};

export type PromptRequestOptions = {
  structuredOutput?: StructuredOutputRequest;
};

const HUGGINGFACE_META_KEY = "co.huggingface";

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

export function isJsonObject(value: unknown): value is JsonObject {
  return asRecord(value) !== undefined;
}

export function isStructuredOutputSupported(capabilities: AgentCapabilities | undefined): boolean {
  const root = asRecord(capabilities?._meta);
  const huggingface = asRecord(root?.[HUGGINGFACE_META_KEY]);
  return huggingface?.structuredOutput === true;
}

export function buildStructuredOutputMeta(
  request: StructuredOutputRequest | undefined,
): Record<string, unknown> | undefined {
  if (!request) {
    return undefined;
  }

  return {
    [HUGGINGFACE_META_KEY]: {
      structuredOutput: {
        schema: request.schema,
        mode: "bestEffort",
      },
    },
  };
}
