// packages/webhooks/src/signature-header.ts
/** Pulls the timestamp and signatures out of `t=<ts>,v1=<sig>,v1=<sig>`. Null when there is nothing usable: never throws on input from the network. */
function parseSignatureHeader(header) {
	const text = Array.isArray(header) ? header.join(",") : header;
	if (typeof text !== "string") return null;
	let timestamp;
	const signatures = [];
	for (const part of text.split(",")) {
		const i = part.indexOf("=");
		if (i < 0) continue;
		const k = part.slice(0, i).trim();
		const v = part.slice(i + 1).trim();
		if (k === "t" && /^\d+$/.test(v)) timestamp = Number(v);
		else if (k === "v1") signatures.push(v);
	}
	return timestamp === void 0 ? null : {
		timestamp,
		signatures
	};
}
export { parseSignatureHeader as t };
