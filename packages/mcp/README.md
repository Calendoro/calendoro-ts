# @calendoro/mcp

Use Calendoro from any MCP client over stdio, with an API key. It forwards to your Calendoro server's `/mcp` endpoint, so what you can do is decided by the key's scopes and your organization's agent policy.

Create a key in Settings > API keys with only the scopes you need: the tool list follows them, and a shorter list works better with most clients.

| Variable | Meaning |
|---|---|
| `CALENDORO_API_KEY` | Required. A `cdo_` API key. |
| `CALENDORO_API_URL` | Your API address, if you host Calendoro yourself. Must be https, except for localhost. |

Client setup for Claude, Cursor, VS Code and Windsurf is in `docs/api/mcp.md`. The server entry for all of them is:

```json
{
  "command": "npx",
  "args": ["-y", "@calendoro/mcp"],
  "env": { "CALENDORO_API_KEY": "cdo_your_key" }
}
```

MIT licensed.
