import { t as parseSignatureHeader } from "./signature-header-q1-ZVoic.js";
// packages/webhooks/src/edge.ts
var hexToBytes = (hex) => {
	if (hex.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(hex)) return null;
	return Uint8Array.from(hex.match(/../g) ?? [], (b) => parseInt(b, 16));
};
/** Same result as `verifySignature`, for any runtime with Web Crypto. `crypto.subtle.verify` compares in constant time. */
async function verifySignatureAsync(header, secret, body, nowSec, toleranceSec = 300) {
	const parsed = parseSignatureHeader(header);
	if (!parsed || Math.abs(nowSec - parsed.timestamp) > toleranceSec) return false;
	const enc = new TextEncoder();
	const key = await crypto.subtle.importKey("raw", enc.encode(secret), {
		name: "HMAC",
		hash: "SHA-256"
	}, false, ["verify"]);
	const data = enc.encode(`${parsed.timestamp}.${body}`);
	for (const s of parsed.signatures) {
		const sig = hexToBytes(s);
		if (sig && await crypto.subtle.verify("HMAC", key, sig, data)) return true;
	}
	return false;
}
export { verifySignatureAsync };
