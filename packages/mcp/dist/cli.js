#!/usr/bin/env node
import { createInterface } from "node:readline";
// packages/mcp/src/relay.ts
var META_VERSION = "io.modelcontextprotocol/protocolVersion";
var failure = (id, code, message) => JSON.stringify({
	jsonrpc: "2.0",
	id: id ?? null,
	error: {
		code,
		message
	}
});
/** Returns a function from one input line to its output line, or undefined when no reply is due (a notification). */
function createRelay(opts) {
	const endpoint = `${opts.apiUrl.replace(/\/+$/, "")}/mcp`;
	const doFetch = opts.fetch ?? globalThis.fetch;
	const timeoutMs = opts.timeoutMs ?? 6e4;
	let negotiated;
	return async (line) => {
		let msg;
		try {
			msg = JSON.parse(line);
		} catch {
			return failure(null, -32700, "Parse error");
		}
		if (typeof msg !== "object" || msg === null) return failure(null, -32600, "Expected a JSON-RPC message");
		const isNotification = !("id" in msg);
		const version = (msg.params?.["_meta"])?.[META_VERSION] ?? (msg.method === "initialize" ? void 0 : negotiated);
		const headers = {
			"content-type": "application/json",
			accept: "application/json",
			authorization: `Bearer ${opts.apiKey}`
		};
		if (typeof version === "string") headers["mcp-protocol-version"] = version;
		if (typeof msg.method === "string") headers["mcp-method"] = msg.method;
		if (msg.method === "tools/call" && typeof msg.params?.["name"] === "string") headers["mcp-name"] = msg.params["name"];
		let res;
		let text;
		try {
			res = await doFetch(endpoint, {
				method: "POST",
				headers,
				body: line,
				signal: AbortSignal.timeout(timeoutMs)
			});
			text = await res.text();
		} catch (e) {
			return isNotification ? void 0 : failure(msg.id, -32e3, `Cannot reach ${endpoint}: ${e instanceof Error ? e.message : "network error"}`);
		}
		if (isNotification) return void 0;
		let reply;
		try {
			reply = JSON.parse(text);
		} catch {
			return failure(msg.id, -32e3, `Unexpected answer from ${endpoint}: HTTP ${res.status}`);
		}
		if (reply.jsonrpc !== "2.0") return failure(msg.id, -32e3, `Unexpected answer from ${endpoint}: HTTP ${res.status}`);
		if (msg.method === "initialize" && typeof reply.result?.protocolVersion === "string") negotiated = reply.result.protocolVersion;
		return JSON.stringify({
			...reply,
			id: reply.id ?? msg.id
		});
	};
}
/** Refuses plain http except to this machine: the key would cross the network readable. */
function assertSafeApiUrl(apiUrl) {
	const u = new URL(apiUrl);
	const local = u.hostname === "localhost" || u.hostname === "127.0.0.1" || u.hostname === "[::1]";
	if (u.protocol !== "https:" && !(u.protocol === "http:" && local)) throw new Error("CALENDORO_API_URL must use https (http is allowed only for localhost)");
}
// packages/mcp/src/cli.ts
var apiKey = process.env["CALENDORO_API_KEY"];
var apiUrl = process.env["CALENDORO_API_URL"] ?? "https://api.calendoro.app";
if (!apiKey) {
	process.stderr.write("calendoro-mcp needs CALENDORO_API_KEY: an API key from Settings > API keys. Set CALENDORO_API_URL too if you host Calendoro yourself.\n");
	process.exit(1);
}
try {
	assertSafeApiUrl(apiUrl);
} catch (e) {
	process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
	process.exit(1);
}
var relay = createRelay({
	apiUrl,
	apiKey
});
var pending = /* @__PURE__ */ new Set();
var rl = createInterface({
	input: process.stdin,
	crlfDelay: Infinity
});
rl.on("line", (line) => {
	if (!line.trim()) return;
	const p = relay(line).then((reply) => {
		if (reply !== void 0) process.stdout.write(`${reply}\n`);
	}).catch((e) => {
		process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
	}).finally(() => pending.delete(p));
	pending.add(p);
});
rl.on("close", () => {
	Promise.all(pending).then(() => process.exit(0));
});
