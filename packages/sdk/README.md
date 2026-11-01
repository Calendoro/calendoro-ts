# @calendoro/sdk

TypeScript client for the Calendoro scheduling API. Works in Node.js 20+, browsers and edge runtimes. Nothing is loaded at runtime beyond this package.

```sh
npm install @calendoro/sdk
```

```ts
import { createClient, paginate, ConflictError } from "@calendoro/sdk";

const api = createClient({ baseUrl: "https://api.calendoro.app", token: process.env.CALENDORO_API_KEY });

const { data: eventTypes } = await api.listEventTypes();
const eventTypeId = eventTypes[0].id;
const { slots } = await api.getSlots({
  query: { eventTypeId, start: "2026-11-02T00:00:00Z", end: "2026-11-03T00:00:00Z", timeZone: "America/New_York" },
});

try {
  await api.createBooking({
    body: { eventTypeId, startAt: slots[0], timeZone: "America/New_York", invitee: { name: "Ann", email: "ann@example.com" } },
  });
} catch (e) {
  if (e instanceof ConflictError && e.code === "slot_unavailable") console.log("Someone took that time.");
  else throw e;
}
```

Every API operation is one method, named by its `operationId` in the OpenAPI document (`GET /openapi.json`), taking `{ params, query, body }`.

## Retries, timeouts and idempotency

- Network errors and 429, 502, 503 and 504 are retried up to `maxRetries` times (default 2) with jittered backoff, honoring `Retry-After`. Only requests safe to repeat are retried: GET, PUT, DELETE and signed-in POSTs (which carry an `Idempotency-Key`), plus public booking creation. Any request is repeated after a 429, because it was refused before doing anything.
- Each attempt times out after `timeoutMs` (default 30 000).
- Those POSTs get an automatic `Idempotency-Key`, the same for all retries of one call. Pass your own through `headers` to stay protected across a crash and restart. Other anonymous POSTs (such as login) are not retried on network errors.

## Pagination

Every list returns `{ data, nextCursor }` and takes `cursor` and `limit`. Walk all of them with:

```ts
for await (const booking of paginate(api, "listBookings", { query: { status: "confirmed" } })) {
  console.log(booking.id);
}
```

## Errors

Everything thrown extends `CalendoroError`, which has `requestId` for support requests.

| Class | When |
|---|---|
| `ValidationError` | 400, 422 |
| `AuthenticationError` | 401 |
| `PermissionError` | 403 |
| `NotFoundError` | 404 |
| `ConflictError` | 409 |
| `RateLimitError` | 429, with `retryAfter` |
| `ServerError` | 5xx |
| `ApiError` | Base of the above: `status`, `code`, `message`, `details` |
| `TimeoutError`, `NetworkError` | No answer |

Responses are not validated by default, so a field or enum value the server adds later cannot break you. To check them yourself, pass `validateResponse`.

To verify webhook signatures, use `@calendoro/webhooks`.

MIT licensed.
