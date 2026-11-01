import { t as parseSignatureHeader } from "./signature-header-q1-ZVoic.js";
import { createHmac, timingSafeEqual } from "node:crypto";
// packages/webhooks/src/sign.ts
/** Hex HMAC-SHA256 of `${timestamp}.${body}`. */
function signPayload(secret, timestamp, body) {
	return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}
/** False, never a throw, for a missing or malformed header: this runs on whatever a stranger sends. */
function verifySignature(header, secret, body, nowSec, toleranceSec = 300) {
	const parsed = parseSignatureHeader(header);
	if (!parsed || Math.abs(nowSec - parsed.timestamp) > toleranceSec) return false;
	const expected = Buffer.from(signPayload(secret, parsed.timestamp, body), "hex");
	return parsed.signatures.some((s) => {
		const got = Buffer.from(s, "hex");
		return got.length === expected.length && timingSafeEqual(got, expected);
	});
}
// packages/webhooks/src/public.ts
var WebhookSignatureError = class extends Error {
	constructor(message = "invalid webhook signature") {
		super(message);
		this.name = "WebhookSignatureError";
	}
};
/**
* Verifies a delivery and parses it. Throws WebhookSignatureError unless the signature is valid and recent.
* Pass the raw request body: reformatted JSON will not verify. Accepts the header from a framework as it arrives, even if missing.
*/
function constructEvent(rawBody, header, secret, opts = {}) {
	if (!verifySignature(header, secret, rawBody, opts.nowSec ?? Math.floor(Date.now() / 1e3), opts.toleranceSec)) throw new WebhookSignatureError();
	return JSON.parse(rawBody);
}
export { WebhookSignatureError, constructEvent, verifySignature };
