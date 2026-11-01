# @calendoro/webhooks

Verify Calendoro webhook signatures. No dependencies.

```sh
npm install @calendoro/webhooks
```

Always verify against the raw request body: reformatted JSON will not match.

## Node.js

```ts
import { constructEvent, WebhookSignatureError } from "@calendoro/webhooks";

app.post("/webhooks/calendoro", express.raw({ type: "application/json" }), (req, res) => {
  let event;
  try {
    event = constructEvent(req.body.toString("utf8"), req.headers["calendoro-signature"], process.env.CALENDORO_WEBHOOK_SECRET);
  } catch (e) {
    if (e instanceof WebhookSignatureError) return res.status(400).end();
    throw e;
  }
  if (event.type === "booking.created") {
    // Delivery is at least once: deduplicate on event.id.
  }
  res.status(200).end();
});
```

`verifySignature(header, secret, rawBody, nowSeconds)` returns a boolean instead. A missing or malformed header gives `false`.

## Cloudflare Workers, Vercel Edge, Deno

```ts
import { verifySignatureAsync } from "@calendoro/webhooks/edge";

const raw = await request.text();
const ok = await verifySignatureAsync(request.headers.get("calendoro-signature"), env.SECRET, raw, Math.floor(Date.now() / 1000));
```

Timestamps more than 5 minutes off are refused. For 24 hours after a secret rotation both signatures are sent, so either secret verifies. Events are listed in `docs/api/webhook-events.md` and in the OpenAPI document's `webhooks` section.

MIT licensed.
