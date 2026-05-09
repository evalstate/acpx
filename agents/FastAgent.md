# Fast Agent

- Built-in name: `fast-agent`
- Default command: `fast-agent-acp`
- Alternate ACP command: `fast-agent acp`
- Upstream: https://github.com/evalstate/fast-agent

If your install exposes ACP through `fast-agent acp` instead of the convenience
wrapper, override the built-in command in config:

```json
{
  "agents": {
    "fast-agent": {
      "command": "fast-agent acp"
    }
  }
}
```

## Structured output

Fast Agent builds that advertise the experimental
`co.huggingface.structuredOutput` ACP extension can be used with:

```bash
acpx fast-agent --structured-output-schema schema.json exec 'extract fields'
```

`acpx` sends the schema on `session/prompt`, captures the completed assistant
text, parses it as strict JSON, and prints the parsed payload. The current MVP
checks JSON syntax only; it does not validate the payload against the schema.

The repository also includes a mixed plain-text and structured-output flow
example that can be run with Fast Agent:

```bash
acpx --approve-all flow run examples/flows/structured-output.flow.ts \
  --default-agent fast-agent
```
