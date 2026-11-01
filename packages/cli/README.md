# calendoro

The Calendoro command line. No runtime dependencies; Node 20 or newer.

```sh
npx calendoro login                     # browser sign-in with PKCE
npx calendoro login --api-key           # paste a key on stdin instead; a cdo_test_ key works in test mode
calendoro whoami
calendoro bookings list --status confirmed --all
calendoro event-types create --data '{"slug":"intro","title":"Intro","durationMinutes":30,"minimumNoticeMinutes":0,"published":true}'
calendoro api getBooking --id bkg_123 --json
```

`calendoro api` lists every operation an API credential can call. Path parameters are flags or positionals, other flags become query parameters, and `--data` takes JSON, `@file` or `-` for stdin. `--all` follows pagination. POSTs get an automatic `Idempotency-Key`; set your own with `--idempotency-key`.

## Local webhooks

```sh
calendoro webhooks listen --forward-to http://localhost:3000/webhooks
calendoro webhooks trigger booking.created
```

`listen` prints a signing secret for the session, and forwards each event with the same headers and body as a real delivery. With a test key you get test events only. With a live credential you get live events, and `trigger` samples reach only your listeners, never your production endpoints.

## Also

`calendoro logs tail`, `calendoro mcp install --client claude|cursor|vscode|windsurf`, `calendoro completion bash|zsh|fish`, and `calendoro profiles [use NAME]`.

Profiles live in `~/.config/calendoro/config.json`, readable only by you. `CALENDORO_API_KEY`, `CALENDORO_API_URL` and `CALENDORO_PROFILE` override them.

MIT licensed.
