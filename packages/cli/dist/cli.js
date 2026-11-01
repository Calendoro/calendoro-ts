#!/usr/bin/env node
import { homedir } from "node:os";
import { chmodSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
// packages/cli/src/args.ts
/** Flags that never take a value, so `--json list` does not swallow `list`. */
var BOOLEAN = /* @__PURE__ */ new Set([
	"json",
	"all",
	"help",
	"no-idempotency",
	"print",
	"live",
	"test",
	"no-browser",
	"version"
]);
function parseArgs(argv) {
	const out = {
		positional: [],
		flags: {},
		all: {}
	};
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === "--") {
			out.positional.push(...argv.slice(i + 1));
			break;
		}
		if (!a.startsWith("--")) {
			if (a === "-h") out.flags["help"] = true;
			else out.positional.push(a);
			continue;
		}
		const eq = a.indexOf("=");
		const name = eq > 0 ? a.slice(2, eq) : a.slice(2);
		const next = argv[i + 1];
		let value = true;
		if (eq > 0) value = a.slice(eq + 1);
		else if (!BOOLEAN.has(name) && next !== void 0 && !next.startsWith("--")) {
			value = next;
			i++;
		}
		out.flags[name] = value;
		if (typeof value === "string") (out.all[name] ??= []).push(value);
	}
	return out;
}
var flagString = (p, name) => typeof p.flags[name] === "string" ? p.flags[name] : void 0;
var configPath = (env) => env["CALENDORO_CONFIG"] ?? join(env["XDG_CONFIG_HOME"] ?? join(env["HOME"] ?? homedir(), ".config"), "calendoro", "config.json");
function loadConfig(path) {
	if (!existsSync(path)) return {
		current: "default",
		profiles: {}
	};
	if (process.platform !== "win32" && (statSync(path).mode & 63) !== 0) chmodSync(path, 384);
	try {
		const parsed = JSON.parse(readFileSync(path, "utf8"));
		return {
			current: parsed.current ?? "default",
			profiles: parsed.profiles ?? {}
		};
	} catch {
		throw new Error(`${path} is not valid JSON. Fix it or delete it, then run \`calendoro login\`.`);
	}
}
function saveConfig(path, config) {
	mkdirSync(dirname(path), {
		recursive: true,
		mode: 448
	});
	writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`, { mode: 384 });
	if (process.platform !== "win32") chmodSync(path, 384);
}
function assertSafeApiUrl(apiUrl) {
	let u;
	try {
		u = new URL(apiUrl);
	} catch {
		throw new Error(`${apiUrl} is not a URL`);
	}
	const local = u.hostname === "localhost" || u.hostname === "127.0.0.1" || u.hostname === "[::1]";
	if (u.protocol !== "https:" && !(u.protocol === "http:" && local)) throw new Error("The API URL must use https (http is allowed only for localhost)");
}
// packages/cli/src/oauth.ts
var CLI_CLIENT_ID = "oac_calendoro_cli";
/** Must match the client's registered redirect URIs in migration 0057. */
var PORTS = [
	53682,
	53683,
	53684
];
var LOGIN_TIMEOUT_MS = 3e5;
var b64 = (b) => b.toString("base64url");
function pkcePair() {
	const verifier = b64(randomBytes(32));
	return {
		verifier,
		challenge: b64(createHash("sha256").update(verifier).digest())
	};
}
function openBrowser(url) {
	const [cmd, args] = process.platform === "darwin" ? ["open", [url]] : process.platform === "win32" ? ["cmd", [
		"/c",
		"start",
		"",
		url
	]] : ["xdg-open", [url]];
	spawn(cmd, args, {
		stdio: "ignore",
		detached: true
	}).on("error", () => {}).unref();
}
function listen$1() {
	return new Promise((resolve, reject) => {
		const tryPort = (i) => {
			const port = PORTS[i];
			if (port === void 0) return reject(/* @__PURE__ */ new Error(`Ports ${PORTS.join(", ")} are all in use, so the browser has nowhere to return to. Free one, or use \`calendoro login --api-key\`.`));
			const server = createServer();
			server.once("error", () => tryPort(i + 1));
			server.listen(port, "127.0.0.1", () => resolve({
				server,
				port
			}));
		};
		tryPort(0);
	});
}
var tokenResult = async (res) => {
	const json = await res.json().catch(() => ({}));
	if (!res.ok || !json.access_token) throw new Error(`Sign-in failed: ${json.error_description ?? json.error ?? `HTTP ${res.status}`}`);
	return {
		accessToken: json.access_token,
		...json.refresh_token ? { refreshToken: json.refresh_token } : {}
	};
};
async function browserLogin(apiUrl, doFetch, say, open) {
	const { server, port } = await listen$1();
	const redirectUri = `http://127.0.0.1:${port}/callback`;
	const { verifier, challenge } = pkcePair();
	const state = b64(randomBytes(16));
	try {
		const code = await new Promise((resolve, reject) => {
			const timer = setTimeout(() => reject(/* @__PURE__ */ new Error("Timed out waiting for the browser. Run `calendoro login` again.")), LOGIN_TIMEOUT_MS);
			server.on("request", (req, res) => {
				const u = new URL(req.url ?? "/", redirectUri);
				if (u.pathname !== "/callback") {
					res.writeHead(404).end();
					return;
				}
				res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
				if (u.searchParams.get("state") !== state) {
					res.end("This sign-in does not match the one in your terminal.");
					return;
				}
				clearTimeout(timer);
				const got = u.searchParams.get("code");
				res.end(got ? "Signed in. You can close this tab and go back to your terminal." : "Sign-in was not completed. You can close this tab.");
				if (got) resolve(got);
				else reject(/* @__PURE__ */ new Error(`Sign-in failed: ${u.searchParams.get("error_description") ?? u.searchParams.get("error") ?? "no code returned"}`));
			});
			const url = `${apiUrl}/oauth/authorize?${new URLSearchParams({
				response_type: "code",
				client_id: CLI_CLIENT_ID,
				redirect_uri: redirectUri,
				state,
				code_challenge: challenge,
				code_challenge_method: "S256",
				scope: SCOPES
			})}`;
			say(`Opening your browser. If it does not open, visit:\n${url}`);
			open(url);
		});
		return await tokenResult(await doFetch(`${apiUrl}/oauth/token`, {
			method: "POST",
			headers: { "content-type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				grant_type: "authorization_code",
				code,
				redirect_uri: redirectUri,
				client_id: CLI_CLIENT_ID,
				code_verifier: verifier
			})
		}));
	} finally {
		server.close();
	}
}
async function refreshLogin(apiUrl, refreshToken, clientId, doFetch) {
	return tokenResult(await doFetch(`${apiUrl}/oauth/token`, {
		method: "POST",
		headers: { "content-type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			grant_type: "refresh_token",
			refresh_token: refreshToken,
			client_id: clientId
		})
	}));
}
var SCOPES = "bookings:read bookings:write event_types:read event_types:write availability:read availability:write webhooks:read webhooks:write users:read users:write organizations:read organizations:write teams:read teams:write routing:read routing:write analytics:read integrations:read integrations:write payments:read payments:write polls:read polls:write services:read services:write recordings:read ai:use audit:read";
// packages/cli/src/version.ts
var CLI_VERSION = "0.1.0";
// packages/cli/src/client.ts
var CliApiError = class extends Error {
	status;
	code;
	details;
	requestId;
	constructor(message, status, code, details, requestId) {
		super(message);
		this.status = status;
		this.code = code;
		this.details = details;
		this.requestId = requestId;
	}
};
function savedSession(path, config, name, doFetch) {
	const profile = config.profiles[name];
	return profile ? {
		profile,
		fetch: doFetch,
		save: () => saveConfig(path, config)
	} : null;
}
var authHeaders = (p) => ({
	authorization: `Bearer ${p.token}`,
	"user-agent": `calendoro-cli/${CLI_VERSION}`,
	accept: "application/json"
});
/** One API call. A rejected OAuth token is refreshed once. */
async function call(s, input) {
	const qs = new URLSearchParams();
	for (const [k, v] of Object.entries(input.query ?? {})) if (v !== void 0) qs.set(k, String(v));
	const url = `${s.profile.apiUrl}${input.path}${qs.size ? `?${qs}` : ""}`;
	const send = () => s.fetch(url, {
		method: input.method,
		headers: {
			...authHeaders(s.profile),
			...input.body !== void 0 ? { "content-type": "application/json" } : {},
			...input.idempotencyKey ? { "idempotency-key": input.idempotencyKey } : {},
			...input.headers
		},
		...input.body !== void 0 ? { body: JSON.stringify(input.body) } : {}
	});
	let res;
	try {
		res = await send();
		if (res.status === 401 && s.profile.kind === "oauth" && s.profile.refreshToken) {
			const fresh = await refreshLogin(s.profile.apiUrl, s.profile.refreshToken, s.profile.clientId ?? "", s.fetch);
			s.profile.token = fresh.accessToken;
			if (fresh.refreshToken) s.profile.refreshToken = fresh.refreshToken;
			s.save?.();
			res = await send();
		}
	} catch (e) {
		if (e instanceof CliApiError) throw e;
		throw new Error(`Could not reach ${s.profile.apiUrl}: ${e instanceof Error ? e.message : String(e)}. Check your network, or the address with \`calendoro profiles\`.`, { cause: e });
	}
	const text = await res.text();
	let json = text;
	try {
		json = text ? JSON.parse(text) : void 0;
	} catch {}
	if (res.ok) return json;
	const err = json?.error;
	throw new CliApiError(err?.message ?? (res.statusText || `HTTP ${res.status}`), res.status, err?.code ?? "http_error", err?.details, res.headers.get("x-request-id") ?? void 0);
}
/** The value sent as Idempotency-Key: the user's, none if asked, else fresh for routes that honor it. */
function idempotencyKeyFor(idempotent, given, disabled) {
	if (disabled) return void 0;
	return given ?? (idempotent ? randomUUID() : void 0);
}
/** Every page of a list, following nextCursor. */
async function callAll(s, input) {
	const out = [];
	let cursor;
	for (;;) {
		const page = await call(s, {
			...input,
			query: {
				...input.query,
				...cursor ? { cursor } : {}
			}
		});
		if (!Array.isArray(page?.data)) throw new Error("--all only works on list commands");
		out.push(...page.data);
		if (!page.nextCursor) return out;
		cursor = page.nextCursor;
	}
}
// packages/cli/src/listen.ts
/** Splits an SSE text stream into events. Keeps the partial tail between chunks. */
function sseParser(onEvent) {
	let buffer = "";
	return (chunk) => {
		buffer += chunk;
		for (;;) {
			const end = buffer.indexOf("\n\n");
			if (end < 0) return;
			const block = buffer.slice(0, end);
			buffer = buffer.slice(end + 2);
			let id;
			let event = "message";
			const data = [];
			for (const line of block.split("\n")) if (line.startsWith("id: ")) id = line.slice(4);
			else if (line.startsWith("event: ")) event = line.slice(7);
			else if (line.startsWith("data: ")) data.push(line.slice(6));
			if (data.length > 0) onEvent({
				...id !== void 0 ? { id } : {},
				event,
				data: data.join("\n")
			});
		}
	};
}
async function forwardFrame(doFetch, url, f) {
	return (await doFetch(url, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			"user-agent": "Calendoro-Webhooks/1 (cli)",
			"calendoro-webhook-version": "1",
			"calendoro-signature": f.signature,
			"calendoro-event-id": f.eventId,
			"calendoro-event-type": f.type,
			"calendoro-mode": f.mode
		},
		body: f.body,
		redirect: "manual",
		signal: AbortSignal.timeout(1e4)
	})).status;
}
async function listen(s, o) {
	const listener = await call(s, {
		method: "POST",
		path: "/v1/developer/listeners",
		body: o.events.length ? { events: o.events } : {}
	});
	o.err(`Listening for ${listener.mode} events.${o.forwardTo ? ` Forwarding to ${o.forwardTo}.` : ""}\nSigning secret for this session: ${listener.secret}\nPress Ctrl-C to stop.`);
	let lastId = "";
	while (!o.signal.aborted) {
		try {
			const res = await s.fetch(`${s.profile.apiUrl}${listener.streamPath}`, {
				headers: {
					...authHeaders(s.profile),
					accept: "text/event-stream",
					...lastId ? { "last-event-id": lastId } : {}
				},
				signal: o.signal
			});
			if (res.status === 401 || res.status === 403 || res.status === 404) throw new Error(`The stream was refused (HTTP ${res.status}). Check the credential with \`calendoro whoami\`; it needs webhooks:read and an owner, admin or developer role.`);
			if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
			const end = {};
			const queue = [];
			const feed = sseParser((e) => {
				if (e.event === "closed") end.code = JSON.parse(e.data).code;
				if (e.event !== "webhook") return;
				if (e.id) lastId = e.id;
				queue.push(handle(s.fetch, JSON.parse(e.data), o));
			});
			const decoder = new TextDecoder();
			for await (const chunk of res.body) {
				feed(decoder.decode(chunk, { stream: true }));
				await Promise.all(queue.splice(0));
			}
			if (end.code === "unauthorized" || end.code === "forbidden") throw new Error("The credential was revoked or lost access, so the stream ended.");
		} catch (e) {
			if (o.signal.aborted) return;
			if (e instanceof Error && /refused|revoked/.test(e.message)) throw e;
			o.err(`Connection lost (${e instanceof Error ? e.message : String(e)}). Reconnecting...`);
		}
		if (!o.signal.aborted) await new Promise((r) => setTimeout(r, o.retryMs ?? 2e3));
	}
}
async function handle(doFetch, f, o) {
	let status = "-";
	if (o.forwardTo) try {
		status = await forwardFrame(doFetch, o.forwardTo, f);
	} catch (e) {
		status = `failed: ${e instanceof Error ? e.message : String(e)}`;
	}
	o.out(o.json ? JSON.stringify({
		eventId: f.eventId,
		type: f.type,
		mode: f.mode,
		forwardStatus: status,
		body: JSON.parse(f.body)
	}) : `${f.mode.padEnd(4)}  ${f.type.padEnd(28)}  ${f.eventId}  ${o.forwardTo ? `-> ${status}` : ""}`.trimEnd());
}
// packages/cli/src/mcp-install.ts
var MCP_CLIENTS = [
	"claude",
	"cursor",
	"vscode",
	"windsurf"
];
function mcpConfigPath(client, home, cwd, platform, appData) {
	switch (client) {
		case "claude":
			if (platform === "darwin") return join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json");
			if (platform === "win32") return join(appData ?? join(home, "AppData", "Roaming"), "Claude", "claude_desktop_config.json");
			return join(home, ".config", "Claude", "claude_desktop_config.json");
		case "cursor": return join(home, ".cursor", "mcp.json");
		case "vscode": return join(cwd, ".vscode", "mcp.json");
		case "windsurf": return join(home, ".codeium", "windsurf", "mcp_config.json");
	}
}
/** A .vscode/mcp.json is usually committed, so VS Code prompts for the key and keeps it in its own secret storage. */
var VSCODE_KEY_INPUT = {
	id: "calendoroApiKey",
	type: "promptString",
	description: "Calendoro API key",
	password: true
};
/** With an API key: the stdio package, pinned to this CLI's version, which needs the key. Without: the hosted server, where the client runs its own OAuth sign-in. */
function mcpServerEntry(client, apiUrl, apiKey) {
	if (apiKey) return {
		...client === "vscode" ? { type: "stdio" } : {},
		command: "npx",
		args: ["-y", `@calendoro/mcp@${CLI_VERSION}`],
		env: {
			CALENDORO_API_KEY: client === "vscode" ? `\${input:${VSCODE_KEY_INPUT.id}}` : apiKey,
			CALENDORO_API_URL: apiUrl
		}
	};
	return client === "vscode" ? {
		type: "http",
		url: `${apiUrl}/mcp`
	} : { url: `${apiUrl}/mcp` };
}
function mcpInstall(path, client, entry) {
	let doc = {};
	if (existsSync(path)) try {
		doc = JSON.parse(readFileSync(path, "utf8"));
	} catch {
		throw new Error(`${path} is not plain JSON, so it was left alone. Add this under "${client === "vscode" ? "servers" : "mcpServers"}" yourself:\n${JSON.stringify({ calendoro: entry }, null, 2)}${client === "vscode" && "env" in entry ? `\nand this under "inputs":\n${JSON.stringify([VSCODE_KEY_INPUT], null, 2)}` : ""}`);
	}
	const key = client === "vscode" ? "servers" : "mcpServers";
	doc[key] = {
		...doc[key],
		calendoro: entry
	};
	const prompted = client === "vscode" && "env" in entry;
	if (prompted) doc["inputs"] = [...(doc["inputs"] ?? []).filter((i) => i.id !== VSCODE_KEY_INPUT.id), VSCODE_KEY_INPUT];
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`);
	if ("env" in entry && !prompted && process.platform !== "win32") chmodSync(path, 384);
}
// packages/cli/src/route-table.ts
var cliRoutes = {
	"getApiIdentity": {
		"method": "GET",
		"path": "/v1/me",
		"summary": "Identify the current credential",
		"idempotent": false,
		"scope": null
	},
	"listEventTypes": {
		"method": "GET",
		"path": "/v1/event-types",
		"summary": "List event types",
		"idempotent": false,
		"scope": "event_types:read"
	},
	"createEventType": {
		"method": "POST",
		"path": "/v1/event-types",
		"summary": "Create an event type",
		"idempotent": true,
		"scope": "event_types:write"
	},
	"getEventType": {
		"method": "GET",
		"path": "/v1/event-types/:id",
		"summary": "Get an event type",
		"idempotent": false,
		"scope": "event_types:read"
	},
	"updateEventType": {
		"method": "PATCH",
		"path": "/v1/event-types/:id",
		"summary": "Update an event type",
		"idempotent": false,
		"scope": "event_types:write"
	},
	"deleteEventType": {
		"method": "DELETE",
		"path": "/v1/event-types/:id",
		"summary": "Delete an event type",
		"idempotent": false,
		"scope": "event_types:write"
	},
	"getSchedule": {
		"method": "GET",
		"path": "/v1/availability/schedule",
		"summary": "Get my default schedule",
		"idempotent": false,
		"scope": "availability:read"
	},
	"putSchedule": {
		"method": "PUT",
		"path": "/v1/availability/schedule",
		"summary": "Replace my default schedule",
		"idempotent": false,
		"scope": "availability:write"
	},
	"getSlots": {
		"method": "GET",
		"path": "/v1/availability/slots",
		"summary": "List bookable times for an event type",
		"idempotent": false,
		"scope": "availability:read"
	},
	"listBookings": {
		"method": "GET",
		"path": "/v1/bookings",
		"summary": "List bookings",
		"idempotent": false,
		"scope": "bookings:read"
	},
	"createBooking": {
		"method": "POST",
		"path": "/v1/bookings",
		"summary": "Book a meeting",
		"idempotent": true,
		"scope": "bookings:write"
	},
	"getBooking": {
		"method": "GET",
		"path": "/v1/bookings/:id",
		"summary": "Get a booking",
		"idempotent": false,
		"scope": "bookings:read"
	},
	"rescheduleBooking": {
		"method": "POST",
		"path": "/v1/bookings/:id/reschedule",
		"summary": "Move a booking",
		"idempotent": true,
		"scope": "bookings:write"
	},
	"cancelBooking": {
		"method": "POST",
		"path": "/v1/bookings/:id/cancel",
		"summary": "Cancel a booking",
		"idempotent": true,
		"scope": "bookings:write"
	},
	"listCalendarConnections": {
		"method": "GET",
		"path": "/v1/calendar-connections",
		"summary": "List connected calendars",
		"idempotent": false,
		"scope": "integrations:read"
	},
	"authorizeCalendar": {
		"method": "POST",
		"path": "/v1/calendar-connections/:provider/authorize",
		"summary": "Start connecting a calendar",
		"idempotent": true,
		"scope": "integrations:write"
	},
	"completeCalendarAuthorization": {
		"method": "POST",
		"path": "/v1/calendar-connections/:provider/complete",
		"summary": "Finish connecting a calendar",
		"idempotent": true,
		"scope": "integrations:write"
	},
	"updateCalendarConnection": {
		"method": "PATCH",
		"path": "/v1/calendar-connections/:id",
		"summary": "Change a calendar connection",
		"idempotent": false,
		"scope": "integrations:write"
	},
	"deleteCalendarConnection": {
		"method": "DELETE",
		"path": "/v1/calendar-connections/:id",
		"summary": "Disconnect a calendar",
		"idempotent": false,
		"scope": "integrations:write"
	},
	"listWebhooks": {
		"method": "GET",
		"path": "/v1/webhooks",
		"summary": "List webhook endpoints",
		"idempotent": false,
		"scope": "webhooks:read"
	},
	"createWebhook": {
		"method": "POST",
		"path": "/v1/webhooks",
		"summary": "Create a webhook endpoint",
		"idempotent": true,
		"scope": "webhooks:write"
	},
	"updateWebhook": {
		"method": "PATCH",
		"path": "/v1/webhooks/:id",
		"summary": "Update a webhook endpoint",
		"idempotent": false,
		"scope": "webhooks:write"
	},
	"deleteWebhook": {
		"method": "DELETE",
		"path": "/v1/webhooks/:id",
		"summary": "Delete a webhook endpoint",
		"idempotent": false,
		"scope": "webhooks:write"
	},
	"testWebhook": {
		"method": "POST",
		"path": "/v1/webhooks/:id/test",
		"summary": "Send a test event",
		"idempotent": true,
		"scope": "webhooks:write"
	},
	"rotateWebhookSecret": {
		"method": "POST",
		"path": "/v1/webhooks/:id/rotate-secret",
		"summary": "Rotate a signing secret",
		"idempotent": true,
		"scope": "webhooks:write"
	},
	"listWebhookDeliveries": {
		"method": "GET",
		"path": "/v1/webhooks/:id/deliveries",
		"summary": "List deliveries",
		"idempotent": false,
		"scope": "webhooks:read"
	},
	"replayWebhookDelivery": {
		"method": "POST",
		"path": "/v1/webhook-deliveries/:id/replay",
		"summary": "Replay a delivery",
		"idempotent": true,
		"scope": "webhooks:write"
	},
	"channelsShortcutNextMeeting": {
		"method": "GET",
		"path": "/v1/shortcuts/next-meeting",
		"summary": "Next meeting, for Siri",
		"idempotent": false,
		"scope": "bookings:read"
	},
	"channelsShortcutBookingLink": {
		"method": "GET",
		"path": "/v1/shortcuts/booking-link",
		"summary": "Booking link, for Siri",
		"idempotent": false,
		"scope": "event_types:read"
	},
	"channelsShortcutAvailability": {
		"method": "GET",
		"path": "/v1/shortcuts/availability",
		"summary": "Open times, for Siri",
		"idempotent": false,
		"scope": "availability:read"
	},
	"orgsDeleteBookingData": {
		"method": "POST",
		"path": "/v1/privacy/delete-booking-data",
		"summary": "Delete booking data by date",
		"idempotent": true,
		"scope": "bookings:write"
	},
	"orgsAdminDashboard": {
		"method": "GET",
		"path": "/v1/admin/dashboard",
		"summary": "Admin dashboard",
		"idempotent": false,
		"scope": "users:read"
	},
	"orgsGetMemberProfile": {
		"method": "GET",
		"path": "/v1/members/:id/profile",
		"summary": "Get a member's admin profile",
		"idempotent": false,
		"scope": "users:read"
	},
	"orgsExportMembersCsv": {
		"method": "GET",
		"path": "/v1/members/export",
		"summary": "Export members as CSV",
		"idempotent": false,
		"scope": "users:read"
	},
	"orgsBulkMembers": {
		"method": "POST",
		"path": "/v1/members/bulk",
		"summary": "Change many members",
		"idempotent": true,
		"scope": "users:write"
	},
	"orgsGroupInvite": {
		"method": "POST",
		"path": "/v1/teams/:id/invitations",
		"summary": "Invite to a team",
		"idempotent": true,
		"scope": "users:write"
	},
	"orgsGroupMeetings": {
		"method": "GET",
		"path": "/v1/teams/:id/meetings",
		"summary": "List a team's meetings",
		"idempotent": false,
		"scope": "bookings:read"
	},
	"orgsGetDomainControl": {
		"method": "GET",
		"path": "/v1/domain-control",
		"summary": "Get domain control",
		"idempotent": false,
		"scope": "users:read"
	},
	"orgsPutDomainControl": {
		"method": "PUT",
		"path": "/v1/domain-control/:id",
		"summary": "Set domain control",
		"idempotent": false,
		"scope": "users:write"
	},
	"orgsListDomainUsers": {
		"method": "GET",
		"path": "/v1/domain-control/users",
		"summary": "List accounts on your domains",
		"idempotent": false,
		"scope": "users:read"
	},
	"orgsInviteDomainUsers": {
		"method": "POST",
		"path": "/v1/domain-control/invitations",
		"summary": "Invite accounts on your domains",
		"idempotent": true,
		"scope": "users:write"
	},
	"orgsGetOrganization": {
		"method": "GET",
		"path": "/v1/organization",
		"summary": "Get the organization",
		"idempotent": false,
		"scope": "organizations:read"
	},
	"orgsUpdateOrganization": {
		"method": "PATCH",
		"path": "/v1/organization",
		"summary": "Update the organization",
		"idempotent": false,
		"scope": "organizations:write"
	},
	"orgsListMembers": {
		"method": "GET",
		"path": "/v1/members",
		"summary": "List members",
		"idempotent": false,
		"scope": "users:read"
	},
	"orgsUpdateMember": {
		"method": "PATCH",
		"path": "/v1/members/:id",
		"summary": "Change a member",
		"idempotent": false,
		"scope": "users:write"
	},
	"orgsRemoveMember": {
		"method": "DELETE",
		"path": "/v1/members/:id",
		"summary": "Remove a member",
		"idempotent": false,
		"scope": "users:write"
	},
	"orgsListInvitations": {
		"method": "GET",
		"path": "/v1/invitations",
		"summary": "List invitations",
		"idempotent": false,
		"scope": "users:read"
	},
	"orgsCreateInvitation": {
		"method": "POST",
		"path": "/v1/invitations",
		"summary": "Invite someone",
		"idempotent": true,
		"scope": "users:write"
	},
	"orgsRevokeInvitation": {
		"method": "DELETE",
		"path": "/v1/invitations/:id",
		"summary": "Revoke an invitation",
		"idempotent": false,
		"scope": "users:write"
	},
	"orgsListTeams": {
		"method": "GET",
		"path": "/v1/teams",
		"summary": "List teams",
		"idempotent": false,
		"scope": "teams:read"
	},
	"orgsCreateTeam": {
		"method": "POST",
		"path": "/v1/teams",
		"summary": "Create a team",
		"idempotent": true,
		"scope": "teams:write"
	},
	"orgsGetTeam": {
		"method": "GET",
		"path": "/v1/teams/:id",
		"summary": "Get a team",
		"idempotent": false,
		"scope": "teams:read"
	},
	"orgsUpdateTeam": {
		"method": "PATCH",
		"path": "/v1/teams/:id",
		"summary": "Update a team",
		"idempotent": false,
		"scope": "teams:write"
	},
	"orgsDeleteTeam": {
		"method": "DELETE",
		"path": "/v1/teams/:id",
		"summary": "Delete a team",
		"idempotent": false,
		"scope": "teams:write"
	},
	"orgsPutTeamMember": {
		"method": "PUT",
		"path": "/v1/teams/:id/members/:userId",
		"summary": "Add or change a team member",
		"idempotent": false,
		"scope": "teams:write"
	},
	"orgsRemoveTeamMember": {
		"method": "DELETE",
		"path": "/v1/teams/:id/members/:userId",
		"summary": "Remove a team member",
		"idempotent": false,
		"scope": "teams:write"
	},
	"orgsListAuditLogs": {
		"method": "GET",
		"path": "/v1/audit-logs",
		"summary": "List audit logs",
		"idempotent": false,
		"scope": "audit:read"
	},
	"schedulingBulkUpdateEventTypes": {
		"method": "POST",
		"path": "/v1/event-types/bulk-update",
		"summary": "Apply settings to several event types",
		"idempotent": true,
		"scope": "event_types:write"
	},
	"schedulingTranslateEventType": {
		"method": "POST",
		"path": "/v1/event-types/:id/translate",
		"summary": "Machine-translate an event type",
		"idempotent": true,
		"scope": "event_types:write"
	},
	"schedulingReportSpam": {
		"method": "POST",
		"path": "/v1/bookings/:id/report-spam",
		"summary": "Report a booking as spam",
		"idempotent": true,
		"scope": "bookings:write"
	},
	"schedulingListLabels": {
		"method": "GET",
		"path": "/v1/scheduling/labels",
		"summary": "List booking labels and statuses",
		"idempotent": false,
		"scope": "bookings:read"
	},
	"schedulingCreateLabel": {
		"method": "POST",
		"path": "/v1/scheduling/labels",
		"summary": "Add a booking label or status",
		"idempotent": true,
		"scope": "teams:write"
	},
	"schedulingDeleteLabel": {
		"method": "DELETE",
		"path": "/v1/scheduling/labels/:id",
		"summary": "Delete a booking label or status",
		"idempotent": false,
		"scope": "teams:write"
	},
	"schedulingGetBookingLabels": {
		"method": "GET",
		"path": "/v1/bookings/:id/labels",
		"summary": "Get a booking's labels",
		"idempotent": false,
		"scope": "bookings:read"
	},
	"schedulingPutBookingLabels": {
		"method": "PUT",
		"path": "/v1/bookings/:id/labels",
		"summary": "Set a booking's labels",
		"idempotent": false,
		"scope": "bookings:write"
	},
	"schedulingLabelsFor": {
		"method": "GET",
		"path": "/v1/scheduling/booking-labels",
		"summary": "Get labels for several bookings",
		"idempotent": false,
		"scope": "bookings:read"
	},
	"schedulingListStaffColors": {
		"method": "GET",
		"path": "/v1/scheduling/staff-colors",
		"summary": "List staff colours",
		"idempotent": false,
		"scope": "teams:read"
	},
	"schedulingPutStaffColor": {
		"method": "PUT",
		"path": "/v1/scheduling/staff-colors/:id",
		"summary": "Set a staff colour",
		"idempotent": false,
		"scope": "teams:write"
	},
	"schedulingListClosures": {
		"method": "GET",
		"path": "/v1/scheduling/closures",
		"summary": "List closures",
		"idempotent": false,
		"scope": "availability:read"
	},
	"schedulingCreateClosure": {
		"method": "POST",
		"path": "/v1/scheduling/closures",
		"summary": "Add a closure",
		"idempotent": true,
		"scope": "availability:write"
	},
	"schedulingDeleteClosure": {
		"method": "DELETE",
		"path": "/v1/scheduling/closures/:id",
		"summary": "Remove a closure",
		"idempotent": false,
		"scope": "availability:write"
	},
	"schedulingGetBookingSettings": {
		"method": "GET",
		"path": "/v1/scheduling/booking-settings",
		"summary": "Get booking page switches",
		"idempotent": false,
		"scope": "teams:read"
	},
	"schedulingPutBookingSettings": {
		"method": "PUT",
		"path": "/v1/scheduling/booking-settings",
		"summary": "Pause booking or set a validator",
		"idempotent": false,
		"scope": "teams:write"
	},
	"schedulingDuplicateEventType": {
		"method": "POST",
		"path": "/v1/event-types/:id/duplicate",
		"summary": "Duplicate an event type",
		"idempotent": true,
		"scope": "event_types:write"
	},
	"schedulingGetUserSchedule": {
		"method": "GET",
		"path": "/v1/availability/users/:id/schedule",
		"summary": "Get a member's schedule",
		"idempotent": false,
		"scope": "availability:read"
	},
	"schedulingPutUserSchedule": {
		"method": "PUT",
		"path": "/v1/availability/users/:id/schedule",
		"summary": "Set a member's schedule",
		"idempotent": false,
		"scope": "availability:write"
	},
	"schedulingListBusyTimes": {
		"method": "GET",
		"path": "/v1/availability/busy-times",
		"summary": "List busy times",
		"idempotent": false,
		"scope": "availability:read"
	},
	"schedulingListUserLocations": {
		"method": "GET",
		"path": "/v1/users/me/locations",
		"summary": "List a user's meeting locations",
		"idempotent": false,
		"scope": "event_types:read"
	},
	"hostopsListOutOfOffice": {
		"method": "GET",
		"path": "/v1/out-of-office",
		"summary": "List time off",
		"idempotent": false,
		"scope": "availability:read"
	},
	"hostopsGetEventTypeHosts": {
		"method": "GET",
		"path": "/v1/event-types/:id/hosts",
		"summary": "List an event type's hosts",
		"idempotent": false,
		"scope": "event_types:read"
	},
	"hostopsPutEventTypeHosts": {
		"method": "PUT",
		"path": "/v1/event-types/:id/hosts",
		"summary": "Replace an event type's hosts",
		"idempotent": false,
		"scope": "event_types:write"
	},
	"hostopsGetBookingSlots": {
		"method": "GET",
		"path": "/v1/bookings/:id/slots",
		"summary": "List times a booking can move to",
		"idempotent": false,
		"scope": "bookings:read"
	},
	"hostopsReassignBooking": {
		"method": "POST",
		"path": "/v1/bookings/:id/reassign",
		"summary": "Give a booking to another host",
		"idempotent": true,
		"scope": "bookings:write"
	},
	"hostopsRequestReschedule": {
		"method": "POST",
		"path": "/v1/bookings/:id/request-reschedule",
		"summary": "Ask the invitee to pick a new time",
		"idempotent": true,
		"scope": "bookings:write"
	},
	"hostopsChangeLocation": {
		"method": "PATCH",
		"path": "/v1/bookings/:id/location",
		"summary": "Change a booking's location",
		"idempotent": false,
		"scope": "bookings:write"
	},
	"hostopsWipeDay": {
		"method": "POST",
		"path": "/v1/bookings/wipe-day",
		"summary": "Clear a day",
		"idempotent": true,
		"scope": "bookings:write"
	},
	"hostopsBookOnBehalf": {
		"method": "POST",
		"path": "/v1/bookings/on-behalf",
		"summary": "Book for another host",
		"idempotent": true,
		"scope": "bookings:write"
	},
	"hostopsTroubleshoot": {
		"method": "GET",
		"path": "/v1/availability/troubleshoot",
		"summary": "Explain why a time is not available",
		"idempotent": false,
		"scope": "availability:read"
	},
	"confirmBooking": {
		"method": "POST",
		"path": "/v1/bookings/:id/confirm",
		"summary": "Accept a booking request",
		"idempotent": true,
		"scope": "bookings:write"
	},
	"declineBooking": {
		"method": "POST",
		"path": "/v1/bookings/:id/decline",
		"summary": "Decline a booking request",
		"idempotent": true,
		"scope": "bookings:write"
	},
	"markBookingNoShow": {
		"method": "POST",
		"path": "/v1/bookings/:id/no-show",
		"summary": "Mark the invitee as a no-show",
		"idempotent": true,
		"scope": "bookings:write"
	},
	"clearBookingNoShow": {
		"method": "DELETE",
		"path": "/v1/bookings/:id/no-show",
		"summary": "Undo an invitee no-show",
		"idempotent": false,
		"scope": "bookings:write"
	},
	"updateBookingInvitee": {
		"method": "PATCH",
		"path": "/v1/bookings/:id/invitee",
		"summary": "Correct invitee details",
		"idempotent": false,
		"scope": "bookings:write"
	},
	"listSchedulingTeams": {
		"method": "GET",
		"path": "/v1/scheduling/teams",
		"summary": "List teams for scheduling",
		"idempotent": false,
		"scope": "teams:read"
	},
	"getRoundRobinState": {
		"method": "GET",
		"path": "/v1/event-types/:id/round-robin-state",
		"summary": "Get round-robin state",
		"idempotent": false,
		"scope": "event_types:read"
	},
	"addBookingGuests": {
		"method": "POST",
		"path": "/v1/bookings/:id/guests",
		"summary": "Add guests to a booking",
		"idempotent": true,
		"scope": "bookings:write"
	},
	"listBookingNotes": {
		"method": "GET",
		"path": "/v1/bookings/:id/notes",
		"summary": "List booking notes",
		"idempotent": false,
		"scope": "bookings:read"
	},
	"createBookingNote": {
		"method": "POST",
		"path": "/v1/bookings/:id/notes",
		"summary": "Add a booking note",
		"idempotent": true,
		"scope": "bookings:write"
	},
	"deleteBookingNote": {
		"method": "DELETE",
		"path": "/v1/bookings/:id/notes/:noteId",
		"summary": "Delete a booking note",
		"idempotent": false,
		"scope": "bookings:write"
	},
	"listBookingAudit": {
		"method": "GET",
		"path": "/v1/bookings/:id/audit",
		"summary": "Get a booking's history",
		"idempotent": false,
		"scope": "bookings:read"
	},
	"getBookingAssignmentReason": {
		"method": "GET",
		"path": "/v1/bookings/:id/assignment-reason",
		"summary": "Get why a host was assigned",
		"idempotent": false,
		"scope": "bookings:read"
	},
	"listSchedulingNotePresets": {
		"method": "GET",
		"path": "/v1/scheduling/note-presets",
		"summary": "List note presets",
		"idempotent": false,
		"scope": "bookings:read"
	},
	"createSchedulingNotePreset": {
		"method": "POST",
		"path": "/v1/scheduling/note-presets",
		"summary": "Add a note preset",
		"idempotent": true,
		"scope": "teams:write"
	},
	"deleteSchedulingNotePreset": {
		"method": "DELETE",
		"path": "/v1/scheduling/note-presets/:id",
		"summary": "Delete a note preset",
		"idempotent": false,
		"scope": "teams:write"
	},
	"listNamedSchedules": {
		"method": "GET",
		"path": "/v1/availability/schedules",
		"summary": "List schedules",
		"idempotent": false,
		"scope": "availability:read"
	},
	"createNamedSchedule": {
		"method": "POST",
		"path": "/v1/availability/schedules",
		"summary": "Create a schedule",
		"idempotent": true,
		"scope": "availability:write"
	},
	"updateNamedSchedule": {
		"method": "PUT",
		"path": "/v1/availability/schedules/:id",
		"summary": "Replace a schedule",
		"idempotent": false,
		"scope": "availability:write"
	},
	"deleteNamedSchedule": {
		"method": "DELETE",
		"path": "/v1/availability/schedules/:id",
		"summary": "Delete a schedule",
		"idempotent": false,
		"scope": "availability:write"
	},
	"getTeamCommonSchedule": {
		"method": "GET",
		"path": "/v1/scheduling/teams/:id/common-schedule",
		"summary": "Get a team's common schedule",
		"idempotent": false,
		"scope": "teams:read"
	},
	"putTeamCommonSchedule": {
		"method": "PUT",
		"path": "/v1/scheduling/teams/:id/common-schedule",
		"summary": "Set a team's common schedule",
		"idempotent": false,
		"scope": "teams:write"
	},
	"deleteTeamCommonSchedule": {
		"method": "DELETE",
		"path": "/v1/scheduling/teams/:id/common-schedule",
		"summary": "Remove a team's common schedule",
		"idempotent": false,
		"scope": "teams:write"
	},
	"followTeamCommonSchedule": {
		"method": "PUT",
		"path": "/v1/scheduling/teams/:id/common-schedule/follow",
		"summary": "Follow a team's common schedule",
		"idempotent": false,
		"scope": "availability:write"
	},
	"listRoutingForms": {
		"method": "GET",
		"path": "/v1/routing/forms",
		"summary": "List routing forms",
		"idempotent": false,
		"scope": "routing:read"
	},
	"createRoutingForm": {
		"method": "POST",
		"path": "/v1/routing/forms",
		"summary": "Create a routing form",
		"idempotent": true,
		"scope": "routing:write"
	},
	"getRoutingForm": {
		"method": "GET",
		"path": "/v1/routing/forms/:id",
		"summary": "Get a routing form",
		"idempotent": false,
		"scope": "routing:read"
	},
	"updateRoutingForm": {
		"method": "PATCH",
		"path": "/v1/routing/forms/:id",
		"summary": "Update a routing form",
		"idempotent": false,
		"scope": "routing:write"
	},
	"deleteRoutingForm": {
		"method": "DELETE",
		"path": "/v1/routing/forms/:id",
		"summary": "Delete a routing form",
		"idempotent": false,
		"scope": "routing:write"
	},
	"testRoutingForm": {
		"method": "POST",
		"path": "/v1/routing/forms/:id/test",
		"summary": "Test a routing form",
		"idempotent": true,
		"scope": "routing:read"
	},
	"listRoutingSubmissions": {
		"method": "GET",
		"path": "/v1/routing/forms/:id/submissions",
		"summary": "List form submissions",
		"idempotent": false,
		"scope": "routing:read"
	},
	"getRoutingAnalytics": {
		"method": "GET",
		"path": "/v1/routing/forms/:id/analytics",
		"summary": "Get form analytics",
		"idempotent": false,
		"scope": "routing:read"
	},
	"routingListQueues": {
		"method": "GET",
		"path": "/v1/routing/queues",
		"summary": "List routing queues",
		"idempotent": false,
		"scope": "routing:read"
	},
	"routingCreateQueue": {
		"method": "POST",
		"path": "/v1/routing/queues",
		"summary": "Create a routing queue",
		"idempotent": true,
		"scope": "routing:write"
	},
	"routingUpdateQueue": {
		"method": "PATCH",
		"path": "/v1/routing/queues/:id",
		"summary": "Update a routing queue",
		"idempotent": false,
		"scope": "routing:write"
	},
	"routingDeleteQueue": {
		"method": "DELETE",
		"path": "/v1/routing/queues/:id",
		"summary": "Delete a routing queue",
		"idempotent": false,
		"scope": "routing:write"
	},
	"routingListRecordRouters": {
		"method": "GET",
		"path": "/v1/routing/record-routers",
		"summary": "List record routers",
		"idempotent": false,
		"scope": "routing:read"
	},
	"routingCreateRecordRouter": {
		"method": "POST",
		"path": "/v1/routing/record-routers",
		"summary": "Create a record router",
		"idempotent": true,
		"scope": "routing:write"
	},
	"routingUpdateRecordRouter": {
		"method": "PATCH",
		"path": "/v1/routing/record-routers/:id",
		"summary": "Update a record router",
		"idempotent": false,
		"scope": "routing:write"
	},
	"routingDeleteRecordRouter": {
		"method": "DELETE",
		"path": "/v1/routing/record-routers/:id",
		"summary": "Delete a record router",
		"idempotent": false,
		"scope": "routing:write"
	},
	"routingRunRecordRouter": {
		"method": "POST",
		"path": "/v1/routing/record-routers/:id/run",
		"summary": "Run a record router",
		"idempotent": true,
		"scope": "routing:write"
	},
	"routingListRecordAssignments": {
		"method": "GET",
		"path": "/v1/routing/record-routers/:id/assignments",
		"summary": "List record assignments",
		"idempotent": false,
		"scope": "routing:read"
	},
	"routingPreviewRecordRouter": {
		"method": "POST",
		"path": "/v1/routing/record-routers/:id/preview",
		"summary": "Preview a record router",
		"idempotent": true,
		"scope": "routing:read"
	},
	"routingMergeRecordDuplicate": {
		"method": "POST",
		"path": "/v1/routing/record-assignments/:id/merge",
		"summary": "Merge a duplicate record",
		"idempotent": true,
		"scope": "routing:write"
	},
	"routingRulesFromText": {
		"method": "POST",
		"path": "/v1/routing/record-rules/from-text",
		"summary": "Draft rules from plain English",
		"idempotent": true,
		"scope": "routing:write"
	},
	"routingCreateHandoff": {
		"method": "POST",
		"path": "/v1/routing/handoffs",
		"summary": "Hand a lead to a colleague",
		"idempotent": true,
		"scope": "routing:write"
	},
	"routingListHandoffs": {
		"method": "GET",
		"path": "/v1/routing/handoffs",
		"summary": "List handoffs",
		"idempotent": false,
		"scope": "routing:read"
	},
	"paymentsGetAccount": {
		"method": "GET",
		"path": "/v1/payments/account",
		"summary": "Get the payment account",
		"idempotent": false,
		"scope": "payments:read"
	},
	"paymentsDisconnect": {
		"method": "DELETE",
		"path": "/v1/payments/account",
		"summary": "Disconnect Stripe",
		"idempotent": false,
		"scope": "payments:write"
	},
	"paymentsGetEventTypeSettings": {
		"method": "GET",
		"path": "/v1/payments/event-types/:id/settings",
		"summary": "Get an event's price",
		"idempotent": false,
		"scope": "payments:read"
	},
	"paymentsPutEventTypeSettings": {
		"method": "PUT",
		"path": "/v1/payments/event-types/:id/settings",
		"summary": "Set an event's price",
		"idempotent": false,
		"scope": "payments:write"
	},
	"paymentsList": {
		"method": "GET",
		"path": "/v1/payments",
		"summary": "List payments",
		"idempotent": false,
		"scope": "payments:read"
	},
	"paymentsRefund": {
		"method": "POST",
		"path": "/v1/payments/:id/refund",
		"summary": "Refund a payment",
		"idempotent": true,
		"scope": "payments:write"
	},
	"paymentsListDiscountCodes": {
		"method": "GET",
		"path": "/v1/payments/discount-codes",
		"summary": "List discount codes",
		"idempotent": false,
		"scope": "payments:read"
	},
	"paymentsCreateDiscountCode": {
		"method": "POST",
		"path": "/v1/payments/discount-codes",
		"summary": "Create a discount code",
		"idempotent": true,
		"scope": "payments:write"
	},
	"paymentsDeactivateDiscountCode": {
		"method": "POST",
		"path": "/v1/payments/discount-codes/:id/deactivate",
		"summary": "Deactivate a discount code",
		"idempotent": true,
		"scope": "payments:write"
	},
	"paymentsListPackages": {
		"method": "GET",
		"path": "/v1/payments/packages",
		"summary": "List session packages",
		"idempotent": false,
		"scope": "payments:read"
	},
	"paymentsCreatePackage": {
		"method": "POST",
		"path": "/v1/payments/packages",
		"summary": "Create a session package",
		"idempotent": true,
		"scope": "payments:write"
	},
	"paymentsDeactivatePackage": {
		"method": "POST",
		"path": "/v1/payments/packages/:id/deactivate",
		"summary": "Deactivate a session package",
		"idempotent": true,
		"scope": "payments:write"
	},
	"paymentsListMembershipPlans": {
		"method": "GET",
		"path": "/v1/payments/membership-plans",
		"summary": "List membership plans",
		"idempotent": false,
		"scope": "payments:read"
	},
	"paymentsCreateMembershipPlan": {
		"method": "POST",
		"path": "/v1/payments/membership-plans",
		"summary": "Create a membership plan",
		"idempotent": true,
		"scope": "payments:write"
	},
	"paymentsDeactivateMembershipPlan": {
		"method": "POST",
		"path": "/v1/payments/membership-plans/:id/deactivate",
		"summary": "Deactivate a membership plan",
		"idempotent": true,
		"scope": "payments:write"
	},
	"paymentsListMemberships": {
		"method": "GET",
		"path": "/v1/payments/memberships",
		"summary": "List memberships",
		"idempotent": false,
		"scope": "payments:read"
	},
	"getSmsSettings": {
		"method": "GET",
		"path": "/v1/sms/settings",
		"summary": "Get SMS settings",
		"idempotent": false,
		"scope": "integrations:read"
	},
	"updateSmsSettings": {
		"method": "PUT",
		"path": "/v1/sms/settings",
		"summary": "Change SMS settings",
		"idempotent": false,
		"scope": "integrations:write"
	},
	"getSmsEventTypeSettings": {
		"method": "GET",
		"path": "/v1/sms/event-types/:id",
		"summary": "Get an event's SMS settings",
		"idempotent": false,
		"scope": "event_types:read"
	},
	"putSmsEventTypeSettings": {
		"method": "PUT",
		"path": "/v1/sms/event-types/:id",
		"summary": "Set an event's SMS settings",
		"idempotent": false,
		"scope": "event_types:write"
	},
	"listSmsMessages": {
		"method": "GET",
		"path": "/v1/sms/messages",
		"summary": "List text messages",
		"idempotent": false,
		"scope": "integrations:read"
	},
	"listSmsOptOuts": {
		"method": "GET",
		"path": "/v1/sms/opt-outs",
		"summary": "List SMS opt-outs",
		"idempotent": false,
		"scope": "integrations:read"
	},
	"crmListConnections": {
		"method": "GET",
		"path": "/v1/crm/connections",
		"summary": "List CRM connections",
		"idempotent": false,
		"scope": "integrations:read"
	},
	"crmUpdateConnection": {
		"method": "PATCH",
		"path": "/v1/crm/connections/:id",
		"summary": "Change a CRM connection",
		"idempotent": false,
		"scope": "integrations:write"
	},
	"crmDeleteConnection": {
		"method": "DELETE",
		"path": "/v1/crm/connections/:id",
		"summary": "Disconnect a CRM",
		"idempotent": false,
		"scope": "integrations:write"
	},
	"crmListEnvironments": {
		"method": "GET",
		"path": "/v1/crm/connections/:id/environments",
		"summary": "List CRM environments",
		"idempotent": false,
		"scope": "integrations:read"
	},
	"crmSelectEnvironment": {
		"method": "POST",
		"path": "/v1/crm/connections/:id/environment",
		"summary": "Switch CRM environment",
		"idempotent": true,
		"scope": "integrations:write"
	},
	"crmListSyncLogs": {
		"method": "GET",
		"path": "/v1/crm/sync-logs",
		"summary": "List CRM sync logs",
		"idempotent": false,
		"scope": "integrations:read"
	},
	"analyticsGetMetrics": {
		"method": "GET",
		"path": "/v1/analytics/metrics",
		"summary": "Get booking metrics",
		"idempotent": false,
		"scope": "analytics:read"
	},
	"analyticsExportCsv": {
		"method": "GET",
		"path": "/v1/analytics/export",
		"summary": "Export booking metrics",
		"idempotent": false,
		"scope": "analytics:read"
	},
	"developerListRequestLogs": {
		"method": "GET",
		"path": "/v1/developer/request-logs",
		"summary": "List API request logs",
		"idempotent": false,
		"scope": "audit:read"
	},
	"developerCreateListener": {
		"method": "POST",
		"path": "/v1/developer/listeners",
		"summary": "Start a webhook listener",
		"idempotent": true,
		"scope": "webhooks:read"
	},
	"developerTriggerEvent": {
		"method": "POST",
		"path": "/v1/developer/events/trigger",
		"summary": "Send a sample webhook event",
		"idempotent": true,
		"scope": "webhooks:write"
	},
	"listDomains": {
		"method": "GET",
		"path": "/v1/domains",
		"summary": "List custom domains",
		"idempotent": false,
		"scope": "organizations:read"
	},
	"createDomain": {
		"method": "POST",
		"path": "/v1/domains",
		"summary": "Add a custom domain",
		"idempotent": true,
		"scope": "organizations:write"
	},
	"verifyDomain": {
		"method": "POST",
		"path": "/v1/domains/:id/verify",
		"summary": "Verify a custom domain",
		"idempotent": true,
		"scope": "organizations:write"
	},
	"deleteDomain": {
		"method": "DELETE",
		"path": "/v1/domains/:id",
		"summary": "Remove a custom domain",
		"idempotent": false,
		"scope": "organizations:write"
	},
	"getDomainsBranding": {
		"method": "GET",
		"path": "/v1/branding",
		"summary": "Get branding",
		"idempotent": false,
		"scope": "organizations:read"
	},
	"updateDomainsBranding": {
		"method": "PATCH",
		"path": "/v1/branding",
		"summary": "Update branding",
		"idempotent": false,
		"scope": "organizations:write"
	},
	"getDomainsSiteSettings": {
		"method": "GET",
		"path": "/v1/branding/site",
		"summary": "Get site and page look",
		"idempotent": false,
		"scope": "organizations:read"
	},
	"updateDomainsSiteSettings": {
		"method": "PATCH",
		"path": "/v1/branding/site",
		"summary": "Update site and page look",
		"idempotent": false,
		"scope": "organizations:write"
	},
	"listDomainsSitePages": {
		"method": "GET",
		"path": "/v1/branding/site/pages",
		"summary": "List site pages and news",
		"idempotent": false,
		"scope": "organizations:read"
	},
	"createDomainsSitePage": {
		"method": "POST",
		"path": "/v1/branding/site/pages",
		"summary": "Create a site page or news post",
		"idempotent": true,
		"scope": "organizations:write"
	},
	"updateDomainsSitePage": {
		"method": "PATCH",
		"path": "/v1/branding/site/pages/:id",
		"summary": "Update a site page",
		"idempotent": false,
		"scope": "organizations:write"
	},
	"deleteDomainsSitePage": {
		"method": "DELETE",
		"path": "/v1/branding/site/pages/:id",
		"summary": "Delete a site page",
		"idempotent": false,
		"scope": "organizations:write"
	},
	"listDomainsGallery": {
		"method": "GET",
		"path": "/v1/branding/site/gallery",
		"summary": "List gallery photos",
		"idempotent": false,
		"scope": "organizations:read"
	},
	"createDomainsGalleryItem": {
		"method": "POST",
		"path": "/v1/branding/site/gallery",
		"summary": "Add a gallery photo",
		"idempotent": true,
		"scope": "organizations:write"
	},
	"deleteDomainsGalleryItem": {
		"method": "DELETE",
		"path": "/v1/branding/site/gallery/:id",
		"summary": "Remove a gallery photo",
		"idempotent": false,
		"scope": "organizations:write"
	},
	"getDomainsInstagram": {
		"method": "GET",
		"path": "/v1/branding/site/instagram",
		"summary": "Get the Instagram feed",
		"idempotent": false,
		"scope": "organizations:read"
	},
	"refreshDomainsInstagram": {
		"method": "POST",
		"path": "/v1/branding/site/instagram/refresh",
		"summary": "Reload Instagram posts",
		"idempotent": true,
		"scope": "organizations:write"
	},
	"disconnectDomainsInstagram": {
		"method": "DELETE",
		"path": "/v1/branding/site/instagram",
		"summary": "Disconnect Instagram",
		"idempotent": false,
		"scope": "organizations:write"
	},
	"getDomainsTeamBranding": {
		"method": "GET",
		"path": "/v1/branding/teams/:id",
		"summary": "Get a team's branding",
		"idempotent": false,
		"scope": "organizations:read"
	},
	"putDomainsTeamBranding": {
		"method": "PUT",
		"path": "/v1/branding/teams/:id",
		"summary": "Set a team's branding",
		"idempotent": false,
		"scope": "organizations:write"
	},
	"listDomainsReviews": {
		"method": "GET",
		"path": "/v1/branding/reviews",
		"summary": "List invitee ratings",
		"idempotent": false,
		"scope": "organizations:read"
	},
	"publishDomainsReview": {
		"method": "PUT",
		"path": "/v1/branding/reviews/:id",
		"summary": "Show or hide a rating",
		"idempotent": false,
		"scope": "organizations:write"
	},
	"listDomainsContactMessages": {
		"method": "GET",
		"path": "/v1/branding/contact-messages",
		"summary": "List contact-form messages",
		"idempotent": false,
		"scope": "organizations:read"
	},
	"updateDomainsContactMessage": {
		"method": "PATCH",
		"path": "/v1/branding/contact-messages/:id",
		"summary": "Mark a message read",
		"idempotent": false,
		"scope": "organizations:write"
	},
	"deleteDomainsContactMessage": {
		"method": "DELETE",
		"path": "/v1/branding/contact-messages/:id",
		"summary": "Delete a contact-form message",
		"idempotent": false,
		"scope": "organizations:write"
	},
	"scanDomainsTicket": {
		"method": "POST",
		"path": "/v1/branding/tickets/scan",
		"summary": "Check in with a QR ticket",
		"idempotent": true,
		"scope": "bookings:write"
	},
	"listPolls": {
		"method": "GET",
		"path": "/v1/polls",
		"summary": "List group polls",
		"idempotent": false,
		"scope": "polls:read"
	},
	"createPoll": {
		"method": "POST",
		"path": "/v1/polls",
		"summary": "Create a group poll",
		"idempotent": true,
		"scope": "polls:write"
	},
	"getPollFreeSlots": {
		"method": "GET",
		"path": "/v1/polls/free-slots",
		"summary": "List free times for a poll",
		"idempotent": false,
		"scope": "polls:read"
	},
	"getPoll": {
		"method": "GET",
		"path": "/v1/polls/:id",
		"summary": "Get a group poll",
		"idempotent": false,
		"scope": "polls:read"
	},
	"updatePoll": {
		"method": "PATCH",
		"path": "/v1/polls/:id",
		"summary": "Update a group poll",
		"idempotent": false,
		"scope": "polls:write"
	},
	"deletePoll": {
		"method": "DELETE",
		"path": "/v1/polls/:id",
		"summary": "Delete a group poll",
		"idempotent": false,
		"scope": "polls:write"
	},
	"duplicatePoll": {
		"method": "POST",
		"path": "/v1/polls/:id/duplicate",
		"summary": "Duplicate a poll",
		"idempotent": true,
		"scope": "polls:write"
	},
	"invitePollParticipants": {
		"method": "POST",
		"path": "/v1/polls/:id/participants",
		"summary": "Invite people to a poll",
		"idempotent": true,
		"scope": "polls:write"
	},
	"finalizePoll": {
		"method": "POST",
		"path": "/v1/polls/:id/finalize",
		"summary": "Choose a poll's time",
		"idempotent": true,
		"scope": "polls:write"
	},
	"exportPollCsv": {
		"method": "GET",
		"path": "/v1/polls/:id/export",
		"summary": "Export poll results",
		"idempotent": false,
		"scope": "polls:read"
	},
	"deletePollComment": {
		"method": "DELETE",
		"path": "/v1/polls/:id/comments/:commentId",
		"summary": "Delete a poll comment",
		"idempotent": false,
		"scope": "polls:write"
	},
	"reopenPoll": {
		"method": "POST",
		"path": "/v1/polls/:id/reopen",
		"summary": "Reopen a poll",
		"idempotent": true,
		"scope": "polls:write"
	},
	"revokePollInvite": {
		"method": "DELETE",
		"path": "/v1/polls/:id/participants/:participantId",
		"summary": "Revoke a poll invite",
		"idempotent": false,
		"scope": "polls:write"
	},
	"reschedulePollEvent": {
		"method": "POST",
		"path": "/v1/polls/:id/reschedule",
		"summary": "Reschedule a poll's event",
		"idempotent": true,
		"scope": "polls:write"
	},
	"cancelPollEvent": {
		"method": "POST",
		"path": "/v1/polls/:id/cancel-event",
		"summary": "Cancel a poll's event",
		"idempotent": true,
		"scope": "polls:write"
	},
	"servicesListServices": {
		"method": "GET",
		"path": "/v1/services/catalog",
		"summary": "List services",
		"idempotent": false,
		"scope": "services:read"
	},
	"servicesCreateService": {
		"method": "POST",
		"path": "/v1/services/catalog",
		"summary": "Create a service",
		"idempotent": true,
		"scope": "services:write"
	},
	"servicesUpdateService": {
		"method": "PATCH",
		"path": "/v1/services/catalog/:id",
		"summary": "Update a service",
		"idempotent": false,
		"scope": "services:write"
	},
	"servicesListStaff": {
		"method": "GET",
		"path": "/v1/services/staff",
		"summary": "List staff",
		"idempotent": false,
		"scope": "services:read"
	},
	"servicesCreateStaff": {
		"method": "POST",
		"path": "/v1/services/staff",
		"summary": "Add a staff member",
		"idempotent": true,
		"scope": "services:write"
	},
	"servicesUpdateStaff": {
		"method": "PATCH",
		"path": "/v1/services/staff/:id",
		"summary": "Update a staff member",
		"idempotent": false,
		"scope": "services:write"
	},
	"servicesListStaffHours": {
		"method": "GET",
		"path": "/v1/services/staff/:id/hours",
		"summary": "List a staff member's hours",
		"idempotent": false,
		"scope": "services:read"
	},
	"servicesPutStaffHours": {
		"method": "PUT",
		"path": "/v1/services/staff/:id/hours/:locationId",
		"summary": "Set a staff member's hours",
		"idempotent": false,
		"scope": "services:write"
	},
	"servicesDeleteStaffHours": {
		"method": "DELETE",
		"path": "/v1/services/staff/:id/hours/:locationId",
		"summary": "Remove a staff member's hours",
		"idempotent": false,
		"scope": "services:write"
	},
	"servicesListLocations": {
		"method": "GET",
		"path": "/v1/services/locations",
		"summary": "List locations",
		"idempotent": false,
		"scope": "services:read"
	},
	"servicesCreateLocation": {
		"method": "POST",
		"path": "/v1/services/locations",
		"summary": "Add a location",
		"idempotent": true,
		"scope": "services:write"
	},
	"servicesUpdateLocation": {
		"method": "PATCH",
		"path": "/v1/services/locations/:id",
		"summary": "Update a location",
		"idempotent": false,
		"scope": "services:write"
	},
	"servicesListResources": {
		"method": "GET",
		"path": "/v1/services/resources",
		"summary": "List resources",
		"idempotent": false,
		"scope": "services:read"
	},
	"servicesCreateResource": {
		"method": "POST",
		"path": "/v1/services/resources",
		"summary": "Add a resource",
		"idempotent": true,
		"scope": "services:write"
	},
	"servicesUpdateResource": {
		"method": "PATCH",
		"path": "/v1/services/resources/:id",
		"summary": "Update a resource",
		"idempotent": false,
		"scope": "services:write"
	},
	"servicesListCustomers": {
		"method": "GET",
		"path": "/v1/services/customers",
		"summary": "List customers",
		"idempotent": false,
		"scope": "services:read"
	},
	"servicesGetCustomer": {
		"method": "GET",
		"path": "/v1/services/customers/:id",
		"summary": "Get a customer",
		"idempotent": false,
		"scope": "services:read"
	},
	"servicesCustomerBookings": {
		"method": "GET",
		"path": "/v1/services/customers/:id/bookings",
		"summary": "List a customer's bookings",
		"idempotent": false,
		"scope": "services:read"
	},
	"servicesUpdateCustomer": {
		"method": "PATCH",
		"path": "/v1/services/customers/:id",
		"summary": "Update a customer",
		"idempotent": false,
		"scope": "services:write"
	},
	"servicesListBookings": {
		"method": "GET",
		"path": "/v1/services/bookings",
		"summary": "List service bookings",
		"idempotent": false,
		"scope": "services:read"
	},
	"servicesCancelBooking": {
		"method": "POST",
		"path": "/v1/services/bookings/:id/cancel",
		"summary": "Cancel a service booking",
		"idempotent": true,
		"scope": "services:write"
	},
	"servicesRescheduleBooking": {
		"method": "POST",
		"path": "/v1/services/bookings/:id/reschedule",
		"summary": "Move a service booking",
		"idempotent": true,
		"scope": "services:write"
	},
	"aiSendMessage": {
		"method": "POST",
		"path": "/v1/ai/messages",
		"summary": "Send a message to the assistant",
		"idempotent": true,
		"scope": "ai:use"
	},
	"aiListConversations": {
		"method": "GET",
		"path": "/v1/ai/conversations",
		"summary": "List conversations",
		"idempotent": false,
		"scope": "ai:use"
	},
	"aiGetConversation": {
		"method": "GET",
		"path": "/v1/ai/conversations/:id",
		"summary": "Get a conversation",
		"idempotent": false,
		"scope": "ai:use"
	},
	"aiDeleteConversation": {
		"method": "DELETE",
		"path": "/v1/ai/conversations/:id",
		"summary": "Delete a conversation",
		"idempotent": false,
		"scope": "ai:use"
	},
	"aiConfirmAction": {
		"method": "POST",
		"path": "/v1/ai/actions/:id/confirm",
		"summary": "Confirm an assistant action",
		"idempotent": true,
		"scope": "ai:use"
	},
	"aiCancelAction": {
		"method": "POST",
		"path": "/v1/ai/actions/:id/cancel",
		"summary": "Cancel an assistant action",
		"idempotent": true,
		"scope": "ai:use"
	},
	"aiGetSuggestions": {
		"method": "GET",
		"path": "/v1/ai/suggestions",
		"summary": "Get time suggestions",
		"idempotent": false,
		"scope": "ai:use"
	},
	"aiGetWorkload": {
		"method": "GET",
		"path": "/v1/ai/workload",
		"summary": "Get workload analysis",
		"idempotent": false,
		"scope": "ai:use"
	},
	"aiGetPreferences": {
		"method": "GET",
		"path": "/v1/ai/preferences",
		"summary": "Get assistant preferences",
		"idempotent": false,
		"scope": "ai:use"
	},
	"aiUpdatePreferences": {
		"method": "PUT",
		"path": "/v1/ai/preferences",
		"summary": "Set assistant preferences",
		"idempotent": false,
		"scope": "ai:use"
	},
	"aiListVoiceCalls": {
		"method": "GET",
		"path": "/v1/ai/voice-calls",
		"summary": "List voice calls",
		"idempotent": false,
		"scope": "bookings:read"
	},
	"aiListHabits": {
		"method": "GET",
		"path": "/v1/ai/habits",
		"summary": "List habits and tasks",
		"idempotent": false,
		"scope": "ai:use"
	},
	"aiCreateHabit": {
		"method": "POST",
		"path": "/v1/ai/habits",
		"summary": "Add a habit or task",
		"idempotent": true,
		"scope": "ai:use"
	},
	"aiUpdateHabit": {
		"method": "PUT",
		"path": "/v1/ai/habits/:id",
		"summary": "Change a habit or task",
		"idempotent": false,
		"scope": "ai:use"
	},
	"aiDeleteHabit": {
		"method": "DELETE",
		"path": "/v1/ai/habits/:id",
		"summary": "Delete a habit or task",
		"idempotent": false,
		"scope": "ai:use"
	},
	"ideasGetNoShowRisk": {
		"method": "GET",
		"path": "/v1/ideas/bookings/:id/no-show-risk",
		"summary": "Get a no-show risk score",
		"idempotent": false,
		"scope": "bookings:read"
	},
	"insightsGetSettings": {
		"method": "GET",
		"path": "/v1/insights/settings",
		"summary": "Get feedback settings",
		"idempotent": false,
		"scope": "analytics:read"
	},
	"insightsGetOverview": {
		"method": "GET",
		"path": "/v1/insights/overview",
		"summary": "Get the insights overview",
		"idempotent": false,
		"scope": "analytics:read"
	},
	"insightsListFeedback": {
		"method": "GET",
		"path": "/v1/insights/feedback",
		"summary": "List meeting feedback",
		"idempotent": false,
		"scope": "analytics:read"
	},
	"insightsGetRouting": {
		"method": "GET",
		"path": "/v1/insights/routing",
		"summary": "Get routing insights",
		"idempotent": false,
		"scope": "analytics:read"
	},
	"insightsGetFunnel": {
		"method": "GET",
		"path": "/v1/insights/funnel",
		"summary": "Get the booking funnel",
		"idempotent": false,
		"scope": "analytics:read"
	},
	"insightsGetSla": {
		"method": "GET",
		"path": "/v1/insights/sla",
		"summary": "Get response times",
		"idempotent": false,
		"scope": "analytics:read"
	},
	"insightsGetOoo": {
		"method": "GET",
		"path": "/v1/insights/out-of-office",
		"summary": "Get time-off insights",
		"idempotent": false,
		"scope": "analytics:read"
	},
	"insightsListWrongAssignments": {
		"method": "GET",
		"path": "/v1/insights/wrong-assignments",
		"summary": "List wrong assignment reports",
		"idempotent": false,
		"scope": "analytics:read"
	},
	"insightsListHostNoShows": {
		"method": "GET",
		"path": "/v1/insights/host-no-shows",
		"summary": "List host no-shows",
		"idempotent": false,
		"scope": "analytics:read"
	},
	"ideasDryRun": {
		"method": "POST",
		"path": "/v1/ideas/dry-run",
		"summary": "Preview a settings change",
		"idempotent": true,
		"scope": "event_types:read"
	},
	"ideasRoutingReplay": {
		"method": "POST",
		"path": "/v1/ideas/routing-replay",
		"summary": "Replay submissions against a draft",
		"idempotent": true,
		"scope": "routing:read"
	},
	"managedListAttributes": {
		"method": "GET",
		"path": "/v1/managed/attributes",
		"summary": "List member attributes",
		"idempotent": false,
		"scope": "organizations:read"
	},
	"managedCreateAttribute": {
		"method": "POST",
		"path": "/v1/managed/attributes",
		"summary": "Create a member attribute",
		"idempotent": true,
		"scope": "organizations:write"
	},
	"managedUpdateAttribute": {
		"method": "PATCH",
		"path": "/v1/managed/attributes/:id",
		"summary": "Update a member attribute",
		"idempotent": false,
		"scope": "organizations:write"
	},
	"managedDeleteAttribute": {
		"method": "DELETE",
		"path": "/v1/managed/attributes/:id",
		"summary": "Delete a member attribute",
		"idempotent": false,
		"scope": "organizations:write"
	},
	"managedListMemberAttributes": {
		"method": "GET",
		"path": "/v1/managed/member-attributes",
		"summary": "List all members' attributes",
		"idempotent": false,
		"scope": "organizations:read"
	},
	"managedGetMemberAttributes": {
		"method": "GET",
		"path": "/v1/managed/members/:id/attributes",
		"summary": "Get a member's attributes",
		"idempotent": false,
		"scope": "organizations:read"
	},
	"managedPutMemberAttributes": {
		"method": "PUT",
		"path": "/v1/managed/members/:id/attributes",
		"summary": "Replace a member's attributes",
		"idempotent": false,
		"scope": "organizations:write"
	},
	"managedListAttributeSyncRules": {
		"method": "GET",
		"path": "/v1/managed/attribute-sync-rules",
		"summary": "List attribute sync rules",
		"idempotent": false,
		"scope": "organizations:read"
	},
	"managedCreateAttributeSyncRule": {
		"method": "POST",
		"path": "/v1/managed/attribute-sync-rules",
		"summary": "Add an attribute sync rule",
		"idempotent": true,
		"scope": "organizations:write"
	},
	"managedDeleteAttributeSyncRule": {
		"method": "DELETE",
		"path": "/v1/managed/attribute-sync-rules/:id",
		"summary": "Delete an attribute sync rule",
		"idempotent": false,
		"scope": "organizations:write"
	},
	"managedRunCrmAttributeSync": {
		"method": "POST",
		"path": "/v1/managed/attribute-sync-rules/run",
		"summary": "Sync attributes from the CRM now",
		"idempotent": true,
		"scope": "organizations:write"
	},
	"managedListRoles": {
		"method": "GET",
		"path": "/v1/managed/roles",
		"summary": "List custom roles",
		"idempotent": false,
		"scope": "organizations:read"
	},
	"managedCreateRole": {
		"method": "POST",
		"path": "/v1/managed/roles",
		"summary": "Create a custom role",
		"idempotent": true,
		"scope": "organizations:write"
	},
	"managedUpdateRole": {
		"method": "PATCH",
		"path": "/v1/managed/roles/:id",
		"summary": "Update a custom role",
		"idempotent": false,
		"scope": "organizations:write"
	},
	"managedDeleteRole": {
		"method": "DELETE",
		"path": "/v1/managed/roles/:id",
		"summary": "Delete a custom role",
		"idempotent": false,
		"scope": "organizations:write"
	},
	"managedAssignMemberRole": {
		"method": "PUT",
		"path": "/v1/managed/members/:id/role",
		"summary": "Assign a member's role",
		"idempotent": false,
		"scope": "organizations:write"
	},
	"managedListTemplates": {
		"method": "GET",
		"path": "/v1/managed/templates",
		"summary": "List event templates",
		"idempotent": false,
		"scope": "event_types:read"
	},
	"managedCreateTemplate": {
		"method": "POST",
		"path": "/v1/managed/templates",
		"summary": "Create an event template",
		"idempotent": true,
		"scope": "event_types:write"
	},
	"managedUpdateTemplate": {
		"method": "PATCH",
		"path": "/v1/managed/templates/:id",
		"summary": "Update an event template",
		"idempotent": false,
		"scope": "event_types:write"
	},
	"managedDeleteTemplate": {
		"method": "DELETE",
		"path": "/v1/managed/templates/:id",
		"summary": "Delete an event template",
		"idempotent": false,
		"scope": "event_types:write"
	},
	"managedSyncTemplate": {
		"method": "POST",
		"path": "/v1/managed/templates/:id/sync",
		"summary": "Sync an event template",
		"idempotent": true,
		"scope": "event_types:write"
	},
	"managedGetEventTypeLocks": {
		"method": "GET",
		"path": "/v1/managed/event-types/:id/locks",
		"summary": "Get an event type's locks",
		"idempotent": false,
		"scope": "event_types:read"
	},
	"ideasIssueReceipt": {
		"method": "POST",
		"path": "/v1/ideas/bookings/:id/receipt",
		"summary": "Issue a booking receipt",
		"idempotent": true,
		"scope": "bookings:write"
	},
	"trustListSendLog": {
		"method": "GET",
		"path": "/v1/trust/send-log",
		"summary": "List sent messages",
		"idempotent": false,
		"scope": "integrations:read"
	},
	"trustExportAuditLogs": {
		"method": "GET",
		"path": "/v1/trust/audit-logs/export",
		"summary": "Export audit logs",
		"idempotent": false,
		"scope": "audit:read"
	},
	"trustEraseInvitee": {
		"method": "POST",
		"path": "/v1/trust/erasure",
		"summary": "Erase an invitee",
		"idempotent": true,
		"scope": "organizations:write"
	},
	"recordingsList": {
		"method": "GET",
		"path": "/v1/recordings",
		"summary": "List recordings",
		"idempotent": false,
		"scope": "recordings:read"
	},
	"recordingsGet": {
		"method": "GET",
		"path": "/v1/recordings/:id",
		"summary": "Get a recording",
		"idempotent": false,
		"scope": "recordings:read"
	},
	"recordingsDelete": {
		"method": "DELETE",
		"path": "/v1/recordings/:id",
		"summary": "Delete a recording",
		"idempotent": false,
		"scope": "bookings:write"
	},
	"recordingsGenerateNotes": {
		"method": "POST",
		"path": "/v1/recordings/:id/notes",
		"summary": "Generate meeting notes",
		"idempotent": true,
		"scope": "bookings:write"
	},
	"recordingsUpdateNotes": {
		"method": "PATCH",
		"path": "/v1/recordings/:id/notes",
		"summary": "Edit meeting notes",
		"idempotent": false,
		"scope": "bookings:write"
	},
	"commerceGetSettings": {
		"method": "GET",
		"path": "/v1/commerce/settings",
		"summary": "Get commerce settings",
		"idempotent": false,
		"scope": "payments:read"
	},
	"commercePutSettings": {
		"method": "PUT",
		"path": "/v1/commerce/settings",
		"summary": "Set commerce settings",
		"idempotent": false,
		"scope": "payments:write"
	},
	"commerceGetPaypal": {
		"method": "GET",
		"path": "/v1/commerce/paypal",
		"summary": "Get PayPal status",
		"idempotent": false,
		"scope": "payments:read"
	},
	"commerceListClasses": {
		"method": "GET",
		"path": "/v1/commerce/classes",
		"summary": "List classes",
		"idempotent": false,
		"scope": "services:read"
	},
	"commerceCreateClass": {
		"method": "POST",
		"path": "/v1/commerce/classes",
		"summary": "Create a class",
		"idempotent": true,
		"scope": "services:write"
	},
	"commerceUpdateClass": {
		"method": "PATCH",
		"path": "/v1/commerce/classes/:id",
		"summary": "Update a class",
		"idempotent": false,
		"scope": "services:write"
	},
	"commerceAddClassSessions": {
		"method": "POST",
		"path": "/v1/commerce/classes/:id/sessions",
		"summary": "Add class sessions",
		"idempotent": true,
		"scope": "services:write"
	},
	"commerceCancelClassSession": {
		"method": "POST",
		"path": "/v1/commerce/class-sessions/:id/cancel",
		"summary": "Cancel a class session",
		"idempotent": true,
		"scope": "services:write"
	},
	"commerceListWaitlist": {
		"method": "GET",
		"path": "/v1/commerce/waitlist",
		"summary": "List the waitlist",
		"idempotent": false,
		"scope": "services:read"
	},
	"commerceRemoveWaitlistEntry": {
		"method": "DELETE",
		"path": "/v1/commerce/waitlist/:id",
		"summary": "Remove a waitlist entry",
		"idempotent": false,
		"scope": "services:write"
	},
	"commerceListGiftCards": {
		"method": "GET",
		"path": "/v1/commerce/gift-cards",
		"summary": "List gift cards",
		"idempotent": false,
		"scope": "payments:read"
	},
	"commerceIssueGiftCard": {
		"method": "POST",
		"path": "/v1/commerce/gift-cards",
		"summary": "Issue a gift card",
		"idempotent": true,
		"scope": "payments:write"
	},
	"commerceVoidGiftCard": {
		"method": "POST",
		"path": "/v1/commerce/gift-cards/:id/void",
		"summary": "Void a gift card",
		"idempotent": true,
		"scope": "payments:write"
	},
	"commerceListAddOns": {
		"method": "GET",
		"path": "/v1/commerce/add-ons",
		"summary": "List add-ons",
		"idempotent": false,
		"scope": "payments:read"
	},
	"commerceCreateAddOn": {
		"method": "POST",
		"path": "/v1/commerce/add-ons",
		"summary": "Create an add-on",
		"idempotent": true,
		"scope": "payments:write"
	},
	"commerceUpdateAddOn": {
		"method": "PATCH",
		"path": "/v1/commerce/add-ons/:id",
		"summary": "Update an add-on",
		"idempotent": false,
		"scope": "payments:write"
	},
	"commerceListTaxRates": {
		"method": "GET",
		"path": "/v1/commerce/tax-rates",
		"summary": "List tax rates",
		"idempotent": false,
		"scope": "payments:read"
	},
	"commerceCreateTaxRate": {
		"method": "POST",
		"path": "/v1/commerce/tax-rates",
		"summary": "Create a tax rate",
		"idempotent": true,
		"scope": "payments:write"
	},
	"commerceGetEventTypeTaxRate": {
		"method": "GET",
		"path": "/v1/commerce/event-types/:id/tax-rate",
		"summary": "Get an event type's attached tax rate",
		"idempotent": false,
		"scope": "payments:read"
	},
	"commercePutEventTypeTaxRate": {
		"method": "PUT",
		"path": "/v1/commerce/event-types/:id/tax-rate",
		"summary": "Attach a tax rate to an event type",
		"idempotent": false,
		"scope": "payments:write"
	},
	"commerceDeactivateTaxRate": {
		"method": "POST",
		"path": "/v1/commerce/tax-rates/:id/deactivate",
		"summary": "Deactivate a tax rate",
		"idempotent": true,
		"scope": "payments:write"
	},
	"commerceTaxReport": {
		"method": "GET",
		"path": "/v1/commerce/reports/tax",
		"summary": "Get the tax report",
		"idempotent": false,
		"scope": "payments:read"
	},
	"commerceListCommissionRules": {
		"method": "GET",
		"path": "/v1/commerce/commissions",
		"summary": "List commission rules",
		"idempotent": false,
		"scope": "payments:read"
	},
	"commercePutCommissionRule": {
		"method": "PUT",
		"path": "/v1/commerce/commissions",
		"summary": "Set a commission rule",
		"idempotent": false,
		"scope": "payments:write"
	},
	"commerceEarningsReport": {
		"method": "GET",
		"path": "/v1/commerce/reports/earnings",
		"summary": "Get the earnings report",
		"idempotent": false,
		"scope": "payments:read"
	},
	"commerceSplitTip": {
		"method": "POST",
		"path": "/v1/commerce/tips/split",
		"summary": "Split a tip",
		"idempotent": true,
		"scope": "payments:write"
	},
	"commerceFutureRevenueReport": {
		"method": "GET",
		"path": "/v1/commerce/reports/future-revenue",
		"summary": "Get the future revenue report",
		"idempotent": false,
		"scope": "payments:read"
	},
	"commerceStaffPerformanceReport": {
		"method": "GET",
		"path": "/v1/commerce/reports/staff-performance",
		"summary": "Get the staff performance report",
		"idempotent": false,
		"scope": "payments:read"
	},
	"commerceListInvoices": {
		"method": "GET",
		"path": "/v1/commerce/invoices",
		"summary": "List invoices",
		"idempotent": false,
		"scope": "payments:read"
	},
	"commerceCreateInvoice": {
		"method": "POST",
		"path": "/v1/commerce/invoices",
		"summary": "Create an invoice",
		"idempotent": true,
		"scope": "payments:write"
	},
	"commerceSendInvoice": {
		"method": "POST",
		"path": "/v1/commerce/invoices/:id/send",
		"summary": "Send an invoice",
		"idempotent": true,
		"scope": "payments:write"
	},
	"commerceVoidInvoice": {
		"method": "POST",
		"path": "/v1/commerce/invoices/:id/void",
		"summary": "Void an invoice",
		"idempotent": true,
		"scope": "payments:write"
	},
	"commerceRecordInvoicePayment": {
		"method": "POST",
		"path": "/v1/commerce/invoices/:id/record-payment",
		"summary": "Record an offline payment",
		"idempotent": true,
		"scope": "payments:write"
	},
	"commerceListEstimates": {
		"method": "GET",
		"path": "/v1/commerce/estimates",
		"summary": "List estimates",
		"idempotent": false,
		"scope": "payments:read"
	},
	"commerceCreateEstimate": {
		"method": "POST",
		"path": "/v1/commerce/estimates",
		"summary": "Create an estimate",
		"idempotent": true,
		"scope": "payments:write"
	},
	"commerceSendEstimate": {
		"method": "POST",
		"path": "/v1/commerce/estimates/:id/send",
		"summary": "Send an estimate",
		"idempotent": true,
		"scope": "payments:write"
	},
	"commerceConvertEstimate": {
		"method": "POST",
		"path": "/v1/commerce/estimates/:id/convert",
		"summary": "Turn an estimate into an invoice",
		"idempotent": true,
		"scope": "payments:write"
	},
	"commerceListPaymentLinks": {
		"method": "GET",
		"path": "/v1/commerce/payment-links",
		"summary": "List payment links",
		"idempotent": false,
		"scope": "payments:read"
	},
	"commerceCreatePaymentLink": {
		"method": "POST",
		"path": "/v1/commerce/payment-links",
		"summary": "Create a payment link",
		"idempotent": true,
		"scope": "payments:write"
	},
	"commerceDeactivatePaymentLink": {
		"method": "POST",
		"path": "/v1/commerce/payment-links/:id/deactivate",
		"summary": "Deactivate a payment link",
		"idempotent": true,
		"scope": "payments:write"
	},
	"commerceListForms": {
		"method": "GET",
		"path": "/v1/commerce/forms",
		"summary": "List intake forms",
		"idempotent": false,
		"scope": "services:read"
	},
	"commerceCreateForm": {
		"method": "POST",
		"path": "/v1/commerce/forms",
		"summary": "Create an intake form",
		"idempotent": true,
		"scope": "services:write"
	},
	"commerceUpdateForm": {
		"method": "PATCH",
		"path": "/v1/commerce/forms/:id",
		"summary": "Update an intake form",
		"idempotent": false,
		"scope": "services:write"
	},
	"commercePutFormEventTypes": {
		"method": "PUT",
		"path": "/v1/commerce/forms/:id/event-types",
		"summary": "Attach a form to event types",
		"idempotent": false,
		"scope": "services:write"
	},
	"commerceListWalkIns": {
		"method": "GET",
		"path": "/v1/commerce/walk-ins",
		"summary": "List walk-ins",
		"idempotent": false,
		"scope": "services:read"
	},
	"commerceCreateWalkIn": {
		"method": "POST",
		"path": "/v1/commerce/walk-ins",
		"summary": "Add a walk-in",
		"idempotent": true,
		"scope": "services:write"
	},
	"commerceUpdateWalkIn": {
		"method": "PATCH",
		"path": "/v1/commerce/walk-ins/:id",
		"summary": "Update a walk-in",
		"idempotent": false,
		"scope": "services:write"
	},
	"commerceCustomerProfile": {
		"method": "GET",
		"path": "/v1/commerce/customers/profile",
		"summary": "Get a customer's commerce profile",
		"idempotent": false,
		"scope": "services:read"
	},
	"retailGetSettings": {
		"method": "GET",
		"path": "/v1/retail/settings",
		"summary": "Get retail settings",
		"idempotent": false,
		"scope": "services:read"
	},
	"retailPutSettings": {
		"method": "PUT",
		"path": "/v1/retail/settings",
		"summary": "Save retail settings",
		"idempotent": false,
		"scope": "services:write"
	},
	"retailListProducts": {
		"method": "GET",
		"path": "/v1/retail/products",
		"summary": "List products",
		"idempotent": false,
		"scope": "services:read"
	},
	"retailCreateProduct": {
		"method": "POST",
		"path": "/v1/retail/products",
		"summary": "Create a product",
		"idempotent": true,
		"scope": "services:write"
	},
	"retailUpdateProduct": {
		"method": "PATCH",
		"path": "/v1/retail/products/:id",
		"summary": "Update a product",
		"idempotent": false,
		"scope": "services:write"
	},
	"retailCreateVariant": {
		"method": "POST",
		"path": "/v1/retail/products/:id/variants",
		"summary": "Add a variant",
		"idempotent": true,
		"scope": "services:write"
	},
	"retailUpdateVariant": {
		"method": "PATCH",
		"path": "/v1/retail/variants/:id",
		"summary": "Update a variant",
		"idempotent": false,
		"scope": "services:write"
	},
	"retailAdjustStock": {
		"method": "POST",
		"path": "/v1/retail/variants/:id/stock",
		"summary": "Adjust stock",
		"idempotent": true,
		"scope": "services:write"
	},
	"retailFindBarcode": {
		"method": "GET",
		"path": "/v1/retail/barcodes/:code",
		"summary": "Find a product by barcode",
		"idempotent": false,
		"scope": "services:read"
	},
	"retailListStockMoves": {
		"method": "GET",
		"path": "/v1/retail/variants/:id/stock",
		"summary": "List stock moves",
		"idempotent": false,
		"scope": "services:read"
	},
	"retailListSuppliers": {
		"method": "GET",
		"path": "/v1/retail/suppliers",
		"summary": "List suppliers",
		"idempotent": false,
		"scope": "services:read"
	},
	"retailCreateSupplier": {
		"method": "POST",
		"path": "/v1/retail/suppliers",
		"summary": "Create a supplier",
		"idempotent": true,
		"scope": "services:write"
	},
	"retailUpdateSupplier": {
		"method": "PATCH",
		"path": "/v1/retail/suppliers/:id",
		"summary": "Update a supplier",
		"idempotent": false,
		"scope": "services:write"
	},
	"retailListPurchaseOrders": {
		"method": "GET",
		"path": "/v1/retail/purchase-orders",
		"summary": "List purchase orders",
		"idempotent": false,
		"scope": "services:read"
	},
	"retailCreatePurchaseOrder": {
		"method": "POST",
		"path": "/v1/retail/purchase-orders",
		"summary": "Create a purchase order",
		"idempotent": true,
		"scope": "services:write"
	},
	"retailOrderPurchaseOrder": {
		"method": "POST",
		"path": "/v1/retail/purchase-orders/:id/order",
		"summary": "Mark an order as sent",
		"idempotent": true,
		"scope": "services:write"
	},
	"retailReceivePurchaseOrder": {
		"method": "POST",
		"path": "/v1/retail/purchase-orders/:id/receive",
		"summary": "Receive stock",
		"idempotent": true,
		"scope": "services:write"
	},
	"retailCancelPurchaseOrder": {
		"method": "POST",
		"path": "/v1/retail/purchase-orders/:id/cancel",
		"summary": "Cancel a purchase order",
		"idempotent": true,
		"scope": "services:write"
	},
	"retailListStockCounts": {
		"method": "GET",
		"path": "/v1/retail/stock-counts",
		"summary": "List stock counts",
		"idempotent": false,
		"scope": "services:read"
	},
	"retailCreateStockCount": {
		"method": "POST",
		"path": "/v1/retail/stock-counts",
		"summary": "Record a stock count",
		"idempotent": true,
		"scope": "services:write"
	},
	"retailCurrentShift": {
		"method": "GET",
		"path": "/v1/retail/shifts/current",
		"summary": "Get the open shift",
		"idempotent": false,
		"scope": "payments:read"
	},
	"retailListShifts": {
		"method": "GET",
		"path": "/v1/retail/shifts",
		"summary": "List shifts",
		"idempotent": false,
		"scope": "payments:read"
	},
	"retailOpenShift": {
		"method": "POST",
		"path": "/v1/retail/shifts",
		"summary": "Open a shift",
		"idempotent": true,
		"scope": "payments:write"
	},
	"retailCashMove": {
		"method": "POST",
		"path": "/v1/retail/shifts/:id/cash-moves",
		"summary": "Record cash in or out",
		"idempotent": true,
		"scope": "payments:write"
	},
	"retailCloseShift": {
		"method": "POST",
		"path": "/v1/retail/shifts/:id/close",
		"summary": "Close a shift",
		"idempotent": true,
		"scope": "payments:write"
	},
	"retailShiftReport": {
		"method": "GET",
		"path": "/v1/retail/shifts/:id/report",
		"summary": "Get a cash-up report",
		"idempotent": false,
		"scope": "payments:read"
	},
	"retailListSales": {
		"method": "GET",
		"path": "/v1/retail/sales",
		"summary": "List sales",
		"idempotent": false,
		"scope": "payments:read"
	},
	"retailCreateSale": {
		"method": "POST",
		"path": "/v1/retail/sales",
		"summary": "Ring up a sale",
		"idempotent": true,
		"scope": "payments:write"
	},
	"retailQuoteSale": {
		"method": "POST",
		"path": "/v1/retail/sales/quote",
		"summary": "Price a sale",
		"idempotent": true,
		"scope": "payments:write"
	},
	"retailGetSale": {
		"method": "GET",
		"path": "/v1/retail/sales/:id",
		"summary": "Get a sale",
		"idempotent": false,
		"scope": "payments:read"
	},
	"retailCheckTerminal": {
		"method": "POST",
		"path": "/v1/retail/sales/:id/terminal/check",
		"summary": "Check a reader payment",
		"idempotent": true,
		"scope": "payments:write"
	},
	"retailStartTerminal": {
		"method": "POST",
		"path": "/v1/retail/sales/:id/terminal/start",
		"summary": "Send a sale to a reader",
		"idempotent": true,
		"scope": "payments:write"
	},
	"retailVoidSale": {
		"method": "POST",
		"path": "/v1/retail/sales/:id/void",
		"summary": "Void a waiting sale",
		"idempotent": true,
		"scope": "payments:write"
	},
	"retailRefundSale": {
		"method": "POST",
		"path": "/v1/retail/sales/:id/refunds",
		"summary": "Refund a sale",
		"idempotent": true,
		"scope": "payments:write"
	},
	"retailEmailReceipt": {
		"method": "POST",
		"path": "/v1/retail/sales/:id/receipt",
		"summary": "Email a receipt",
		"idempotent": true,
		"scope": "payments:write"
	},
	"retailListReaders": {
		"method": "GET",
		"path": "/v1/retail/terminal/readers",
		"summary": "List card readers",
		"idempotent": false,
		"scope": "payments:read"
	},
	"retailRegisterReader": {
		"method": "POST",
		"path": "/v1/retail/terminal/readers",
		"summary": "Register a card reader",
		"idempotent": true,
		"scope": "payments:write"
	},
	"retailDeleteReader": {
		"method": "DELETE",
		"path": "/v1/retail/terminal/readers/:id",
		"summary": "Remove a card reader",
		"idempotent": false,
		"scope": "payments:write"
	},
	"retailListTerminalLocations": {
		"method": "GET",
		"path": "/v1/retail/terminal/locations",
		"summary": "List reader locations",
		"idempotent": false,
		"scope": "payments:read"
	},
	"retailCreateTerminalLocation": {
		"method": "POST",
		"path": "/v1/retail/terminal/locations",
		"summary": "Add a reader location",
		"idempotent": true,
		"scope": "payments:write"
	},
	"retailCustomer": {
		"method": "GET",
		"path": "/v1/retail/customer",
		"summary": "Look up a customer",
		"idempotent": false,
		"scope": "services:read"
	},
	"retailListTimeEntries": {
		"method": "GET",
		"path": "/v1/retail/time-entries",
		"summary": "List time entries",
		"idempotent": false,
		"scope": "services:read"
	},
	"retailUpdateTimeEntry": {
		"method": "PATCH",
		"path": "/v1/retail/time-entries/:id",
		"summary": "Correct a time entry",
		"idempotent": false,
		"scope": "services:write"
	},
	"retailPayrollReport": {
		"method": "GET",
		"path": "/v1/retail/payroll",
		"summary": "Get a payroll report",
		"idempotent": false,
		"scope": "payments:read"
	},
	"retailPayrollCsv": {
		"method": "GET",
		"path": "/v1/retail/payroll/export",
		"summary": "Export payroll",
		"idempotent": false,
		"scope": "payments:read"
	},
	"retailPutPayrollCode": {
		"method": "PUT",
		"path": "/v1/retail/payroll/codes/:id",
		"summary": "Set a Gusto code",
		"idempotent": false,
		"scope": "payments:write"
	},
	"retailListWageRates": {
		"method": "GET",
		"path": "/v1/retail/wage-rates",
		"summary": "List wage rates",
		"idempotent": false,
		"scope": "payments:read"
	},
	"retailCreateWageRate": {
		"method": "POST",
		"path": "/v1/retail/wage-rates",
		"summary": "Add a wage rate",
		"idempotent": true,
		"scope": "payments:write"
	},
	"retailDeactivateWageRate": {
		"method": "POST",
		"path": "/v1/retail/wage-rates/:id/deactivate",
		"summary": "Retire a wage rate",
		"idempotent": true,
		"scope": "payments:write"
	},
	"retailLaborReport": {
		"method": "GET",
		"path": "/v1/retail/reports/labor",
		"summary": "Get labor vs sales",
		"idempotent": false,
		"scope": "payments:read"
	},
	"retailListRewards": {
		"method": "GET",
		"path": "/v1/retail/rewards",
		"summary": "List rewards",
		"idempotent": false,
		"scope": "services:read"
	},
	"retailCreateReward": {
		"method": "POST",
		"path": "/v1/retail/rewards",
		"summary": "Create a reward",
		"idempotent": true,
		"scope": "services:write"
	},
	"retailDeactivateReward": {
		"method": "POST",
		"path": "/v1/retail/rewards/:id/deactivate",
		"summary": "Retire a reward",
		"idempotent": true,
		"scope": "services:write"
	},
	"retailAdjustPoints": {
		"method": "POST",
		"path": "/v1/retail/loyalty/adjust",
		"summary": "Adjust points",
		"idempotent": true,
		"scope": "services:write"
	},
	"retailLoyaltyLedger": {
		"method": "GET",
		"path": "/v1/retail/loyalty/ledger",
		"summary": "List point changes",
		"idempotent": false,
		"scope": "services:read"
	},
	"retailListCampaigns": {
		"method": "GET",
		"path": "/v1/retail/campaigns",
		"summary": "List campaigns",
		"idempotent": false,
		"scope": "services:read"
	},
	"retailCreateCampaign": {
		"method": "POST",
		"path": "/v1/retail/campaigns",
		"summary": "Create a campaign",
		"idempotent": true,
		"scope": "services:write"
	},
	"retailScheduleCampaign": {
		"method": "POST",
		"path": "/v1/retail/campaigns/:id/schedule",
		"summary": "Schedule a campaign",
		"idempotent": true,
		"scope": "services:write"
	},
	"retailActivateWinback": {
		"method": "POST",
		"path": "/v1/retail/campaigns/:id/activate",
		"summary": "Turn on a win-back",
		"idempotent": true,
		"scope": "services:write"
	},
	"retailCancelCampaign": {
		"method": "POST",
		"path": "/v1/retail/campaigns/:id/cancel",
		"summary": "Cancel a campaign",
		"idempotent": true,
		"scope": "services:write"
	},
	"retailPreviewSegment": {
		"method": "POST",
		"path": "/v1/retail/campaigns/preview",
		"summary": "Preview a segment",
		"idempotent": true,
		"scope": "services:read"
	},
	"retailSetMarketingConsent": {
		"method": "POST",
		"path": "/v1/retail/marketing-consent",
		"summary": "Record marketing consent",
		"idempotent": true,
		"scope": "services:write"
	},
	"retailAccountingList": {
		"method": "GET",
		"path": "/v1/retail/accounting",
		"summary": "List accounting connections",
		"idempotent": false,
		"scope": "integrations:read"
	},
	"retailAccountingUpdate": {
		"method": "PATCH",
		"path": "/v1/retail/accounting/connections/:id",
		"summary": "Set accounting mappings",
		"idempotent": false,
		"scope": "integrations:write"
	},
	"retailAccountingDisconnect": {
		"method": "DELETE",
		"path": "/v1/retail/accounting/connections/:id",
		"summary": "Disconnect accounting",
		"idempotent": false,
		"scope": "integrations:write"
	},
	"retailAccountingListSync": {
		"method": "GET",
		"path": "/v1/retail/accounting/connections/:id/sync",
		"summary": "List synced records",
		"idempotent": false,
		"scope": "integrations:read"
	},
	"retailAccountingRetry": {
		"method": "POST",
		"path": "/v1/retail/accounting/connections/:id/retry",
		"summary": "Retry failed records",
		"idempotent": true,
		"scope": "integrations:write"
	},
	"retailListKiosks": {
		"method": "GET",
		"path": "/v1/retail/kiosks",
		"summary": "List kiosks",
		"idempotent": false,
		"scope": "services:read"
	},
	"retailCreateKiosk": {
		"method": "POST",
		"path": "/v1/retail/kiosks",
		"summary": "Create a kiosk",
		"idempotent": true,
		"scope": "services:write"
	},
	"retailDeactivateKiosk": {
		"method": "POST",
		"path": "/v1/retail/kiosks/:id/deactivate",
		"summary": "Turn off a kiosk",
		"idempotent": true,
		"scope": "services:write"
	},
	"retailQueue": {
		"method": "GET",
		"path": "/v1/retail/queue",
		"summary": "Get the walk-in queue",
		"idempotent": false,
		"scope": "services:read"
	},
	"retailCallWalkIn": {
		"method": "POST",
		"path": "/v1/retail/queue/:id/call",
		"summary": "Call someone from the queue",
		"idempotent": true,
		"scope": "services:write"
	},
	"retailStartWalkIn": {
		"method": "POST",
		"path": "/v1/retail/queue/:id/start",
		"summary": "Start a walk-in",
		"idempotent": true,
		"scope": "services:write"
	},
	"retailFinishWalkIn": {
		"method": "POST",
		"path": "/v1/retail/queue/:id/finish",
		"summary": "Finish a walk-in",
		"idempotent": true,
		"scope": "services:write"
	},
	"retailListResourceHolds": {
		"method": "GET",
		"path": "/v1/retail/resource-holds",
		"summary": "List resource use",
		"idempotent": false,
		"scope": "services:read"
	},
	"retailCreateResourceHold": {
		"method": "POST",
		"path": "/v1/retail/resource-holds",
		"summary": "Hold a room or equipment",
		"idempotent": true,
		"scope": "services:write"
	},
	"retailDeleteResourceHold": {
		"method": "DELETE",
		"path": "/v1/retail/resource-holds/:id",
		"summary": "Release a hold",
		"idempotent": false,
		"scope": "services:write"
	},
	"retailListListings": {
		"method": "GET",
		"path": "/v1/retail/directory",
		"summary": "List location pages",
		"idempotent": false,
		"scope": "services:read"
	},
	"retailPutListing": {
		"method": "PUT",
		"path": "/v1/retail/directory/:id",
		"summary": "Save a location page",
		"idempotent": false,
		"scope": "services:write"
	},
	"listWorkflows": {
		"method": "GET",
		"path": "/v1/workflows",
		"summary": "List workflows",
		"idempotent": false,
		"scope": "event_types:read"
	},
	"createWorkflow": {
		"method": "POST",
		"path": "/v1/workflows",
		"summary": "Create a workflow",
		"idempotent": true,
		"scope": "event_types:write"
	},
	"listWorkflowTemplates": {
		"method": "GET",
		"path": "/v1/workflows/templates",
		"summary": "List workflow templates",
		"idempotent": false,
		"scope": "event_types:read"
	},
	"listWorkflowEventTypes": {
		"method": "GET",
		"path": "/v1/workflows/event-types",
		"summary": "List event types for workflows",
		"idempotent": false,
		"scope": "event_types:read"
	},
	"previewWorkflow": {
		"method": "POST",
		"path": "/v1/workflows/preview",
		"summary": "Preview a workflow message",
		"idempotent": true,
		"scope": "event_types:read"
	},
	"listWorkflowRuns": {
		"method": "GET",
		"path": "/v1/workflows/runs",
		"summary": "List workflow runs",
		"idempotent": false,
		"scope": "event_types:read"
	},
	"getWorkflow": {
		"method": "GET",
		"path": "/v1/workflows/:id",
		"summary": "Get a workflow",
		"idempotent": false,
		"scope": "event_types:read"
	},
	"updateWorkflow": {
		"method": "PATCH",
		"path": "/v1/workflows/:id",
		"summary": "Update a workflow",
		"idempotent": false,
		"scope": "event_types:write"
	},
	"deleteWorkflow": {
		"method": "DELETE",
		"path": "/v1/workflows/:id",
		"summary": "Delete a workflow",
		"idempotent": false,
		"scope": "event_types:write"
	},
	"appsDirectory": {
		"method": "GET",
		"path": "/v1/apps",
		"summary": "List available apps",
		"idempotent": false,
		"scope": "integrations:read"
	},
	"appsSlackListInstalls": {
		"method": "GET",
		"path": "/v1/apps/slack/installs",
		"summary": "List Slack installs",
		"idempotent": false,
		"scope": "integrations:read"
	},
	"appsSlackDeleteInstall": {
		"method": "DELETE",
		"path": "/v1/apps/slack/installs/:id",
		"summary": "Disconnect Slack",
		"idempotent": false,
		"scope": "integrations:write"
	},
	"appsSlackListChannelOptions": {
		"method": "GET",
		"path": "/v1/apps/slack/installs/:id/channels",
		"summary": "List Slack channels",
		"idempotent": false,
		"scope": "integrations:read"
	},
	"appsListChannels": {
		"method": "GET",
		"path": "/v1/apps/channels",
		"summary": "List notification channels",
		"idempotent": false,
		"scope": "integrations:read"
	},
	"appsCreateChannel": {
		"method": "POST",
		"path": "/v1/apps/channels",
		"summary": "Add a notification channel",
		"idempotent": true,
		"scope": "integrations:write"
	},
	"appsUpdateChannel": {
		"method": "PATCH",
		"path": "/v1/apps/channels/:id",
		"summary": "Change a notification channel",
		"idempotent": false,
		"scope": "integrations:write"
	},
	"appsDeleteChannel": {
		"method": "DELETE",
		"path": "/v1/apps/channels/:id",
		"summary": "Remove a notification channel",
		"idempotent": false,
		"scope": "integrations:write"
	},
	"appsTestChannel": {
		"method": "POST",
		"path": "/v1/apps/channels/:id/test",
		"summary": "Test a notification channel",
		"idempotent": true,
		"scope": "integrations:write"
	},
	"appsListDeliveries": {
		"method": "GET",
		"path": "/v1/apps/deliveries",
		"summary": "List channel messages",
		"idempotent": false,
		"scope": "integrations:read"
	},
	"appsListConnections": {
		"method": "GET",
		"path": "/v1/apps/connections",
		"summary": "List app connections",
		"idempotent": false,
		"scope": "integrations:read"
	},
	"appsCreateConnection": {
		"method": "POST",
		"path": "/v1/apps/connections",
		"summary": "Connect an app",
		"idempotent": true,
		"scope": "integrations:write"
	},
	"appsUpdateConnection": {
		"method": "PATCH",
		"path": "/v1/apps/connections/:id",
		"summary": "Change an app connection",
		"idempotent": false,
		"scope": "integrations:write"
	},
	"appsDeleteConnection": {
		"method": "DELETE",
		"path": "/v1/apps/connections/:id",
		"summary": "Disconnect an app",
		"idempotent": false,
		"scope": "integrations:write"
	},
	"appsListHooks": {
		"method": "GET",
		"path": "/v1/apps/hooks",
		"summary": "List REST hooks",
		"idempotent": false,
		"scope": "webhooks:read"
	},
	"appsSubscribeHook": {
		"method": "POST",
		"path": "/v1/apps/hooks",
		"summary": "Subscribe a REST hook",
		"idempotent": true,
		"scope": "webhooks:write"
	},
	"appsUnsubscribeHook": {
		"method": "DELETE",
		"path": "/v1/apps/hooks/:id",
		"summary": "Unsubscribe a REST hook",
		"idempotent": false,
		"scope": "webhooks:write"
	},
	"appsHookSamples": {
		"method": "GET",
		"path": "/v1/apps/hooks/samples/:event",
		"summary": "Get sample hook payloads",
		"idempotent": false,
		"scope": "bookings:read"
	},
	"appsListTracking": {
		"method": "GET",
		"path": "/v1/apps/tracking",
		"summary": "List analytics tags",
		"idempotent": false,
		"scope": "event_types:read"
	},
	"appsGetTracking": {
		"method": "GET",
		"path": "/v1/apps/tracking/:eventTypeId",
		"summary": "Get an event's analytics tags",
		"idempotent": false,
		"scope": "event_types:read"
	},
	"appsPutTracking": {
		"method": "PUT",
		"path": "/v1/apps/tracking/:eventTypeId",
		"summary": "Set an event's analytics tags",
		"idempotent": false,
		"scope": "event_types:write"
	},
	"contactsListFieldDefs": {
		"method": "GET",
		"path": "/v1/contacts/field-definitions",
		"summary": "List contact field definitions",
		"idempotent": false,
		"scope": "bookings:read"
	},
	"contactsCreateFieldDef": {
		"method": "POST",
		"path": "/v1/contacts/field-definitions",
		"summary": "Define a contact field",
		"idempotent": true,
		"scope": "bookings:write"
	},
	"contactsDeleteFieldDef": {
		"method": "DELETE",
		"path": "/v1/contacts/field-definitions/:id",
		"summary": "Delete a contact field definition",
		"idempotent": false,
		"scope": "bookings:write"
	},
	"contactsCard": {
		"method": "GET",
		"path": "/v1/contacts/card",
		"summary": "Get a contact card",
		"idempotent": false,
		"scope": "bookings:read"
	},
	"contactsListOpportunities": {
		"method": "GET",
		"path": "/v1/opportunities",
		"summary": "List opportunities",
		"idempotent": false,
		"scope": "bookings:read"
	},
	"contactsCreateOpportunity": {
		"method": "POST",
		"path": "/v1/opportunities",
		"summary": "Create an opportunity",
		"idempotent": true,
		"scope": "bookings:write"
	},
	"contactsUpdateOpportunity": {
		"method": "PATCH",
		"path": "/v1/opportunities/:id",
		"summary": "Update an opportunity",
		"idempotent": false,
		"scope": "bookings:write"
	},
	"contactsDeleteOpportunity": {
		"method": "DELETE",
		"path": "/v1/opportunities/:id",
		"summary": "Delete an opportunity",
		"idempotent": false,
		"scope": "bookings:write"
	},
	"contactsList": {
		"method": "GET",
		"path": "/v1/contacts",
		"summary": "List contacts",
		"idempotent": false,
		"scope": "bookings:read"
	},
	"contactsCreate": {
		"method": "POST",
		"path": "/v1/contacts",
		"summary": "Add a contact",
		"idempotent": true,
		"scope": "bookings:write"
	},
	"contactsListTags": {
		"method": "GET",
		"path": "/v1/contacts/tags",
		"summary": "List contact tags",
		"idempotent": false,
		"scope": "bookings:read"
	},
	"contactsListDuplicates": {
		"method": "GET",
		"path": "/v1/contacts/duplicates",
		"summary": "Find duplicate contacts",
		"idempotent": false,
		"scope": "bookings:read"
	},
	"contactsExportCsv": {
		"method": "GET",
		"path": "/v1/contacts/export",
		"summary": "Export contacts",
		"idempotent": false,
		"scope": "bookings:read"
	},
	"contactsImportCsv": {
		"method": "POST",
		"path": "/v1/contacts/import",
		"summary": "Import contacts",
		"idempotent": true,
		"scope": "bookings:write"
	},
	"contactsGet": {
		"method": "GET",
		"path": "/v1/contacts/:id",
		"summary": "Get a contact",
		"idempotent": false,
		"scope": "bookings:read"
	},
	"contactsHistory": {
		"method": "GET",
		"path": "/v1/contacts/:id/bookings",
		"summary": "Get a contact's bookings",
		"idempotent": false,
		"scope": "bookings:read"
	},
	"contactsUpdate": {
		"method": "PATCH",
		"path": "/v1/contacts/:id",
		"summary": "Update a contact",
		"idempotent": false,
		"scope": "bookings:write"
	},
	"contactsDelete": {
		"method": "DELETE",
		"path": "/v1/contacts/:id",
		"summary": "Delete a contact",
		"idempotent": false,
		"scope": "bookings:write"
	},
	"contactsMerge": {
		"method": "POST",
		"path": "/v1/contacts/:id/merge",
		"summary": "Merge contacts",
		"idempotent": true,
		"scope": "bookings:write"
	},
	"contactsBookingLinks": {
		"method": "GET",
		"path": "/v1/contacts/:id/booking-links",
		"summary": "Get links to send a contact",
		"idempotent": false,
		"scope": "bookings:read"
	},
	"getGroupLinkSettings": {
		"method": "GET",
		"path": "/v1/links/group-settings",
		"summary": "Get group link settings",
		"idempotent": false,
		"scope": "event_types:read"
	},
	"putGroupLinkSettings": {
		"method": "PUT",
		"path": "/v1/links/group-settings",
		"summary": "Change group link settings",
		"idempotent": false,
		"scope": "event_types:write"
	},
	"listLinks": {
		"method": "GET",
		"path": "/v1/links",
		"summary": "List scheduling links",
		"idempotent": false,
		"scope": "event_types:read"
	},
	"createLink": {
		"method": "POST",
		"path": "/v1/links",
		"summary": "Create a scheduling link",
		"idempotent": true,
		"scope": "event_types:write"
	},
	"createOneOffLink": {
		"method": "POST",
		"path": "/v1/links/one-off",
		"summary": "Create a one-off link",
		"idempotent": true,
		"scope": "event_types:write"
	},
	"listLinkableEventTypes": {
		"method": "GET",
		"path": "/v1/links/event-types",
		"summary": "List event types for links",
		"idempotent": false,
		"scope": "event_types:read"
	},
	"getLinksFreeSlots": {
		"method": "GET",
		"path": "/v1/links/free-slots",
		"summary": "List free times for a link",
		"idempotent": false,
		"scope": "availability:read"
	},
	"getHolidaySettings": {
		"method": "GET",
		"path": "/v1/links/holidays",
		"summary": "Get holiday settings",
		"idempotent": false,
		"scope": "availability:read"
	},
	"putHolidaySettings": {
		"method": "PUT",
		"path": "/v1/links/holidays",
		"summary": "Set holiday settings",
		"idempotent": false,
		"scope": "availability:write"
	},
	"previewHolidays": {
		"method": "GET",
		"path": "/v1/links/holidays/preview",
		"summary": "Preview holidays",
		"idempotent": false,
		"scope": "availability:read"
	},
	"getLink": {
		"method": "GET",
		"path": "/v1/links/:id",
		"summary": "Get a scheduling link",
		"idempotent": false,
		"scope": "event_types:read"
	},
	"revokeLink": {
		"method": "DELETE",
		"path": "/v1/links/:id",
		"summary": "Revoke a scheduling link",
		"idempotent": false,
		"scope": "event_types:write"
	}
};
// packages/cli/src/main.ts
/** `calendoro <resource> <verb> [ids...]`: friendly names for the main resources. Positionals fill the route's path parameters in order. */
var FRIENDLY = {
	bookings: {
		list: "listBookings",
		get: "getBooking",
		create: "createBooking",
		cancel: "cancelBooking",
		reschedule: "rescheduleBooking"
	},
	"event-types": {
		list: "listEventTypes",
		get: "getEventType",
		create: "createEventType",
		update: "updateEventType",
		delete: "deleteEventType"
	},
	webhooks: {
		list: "listWebhooks",
		create: "createWebhook",
		update: "updateWebhook",
		delete: "deleteWebhook",
		test: "testWebhook",
		"rotate-secret": "rotateWebhookSecret",
		deliveries: "listWebhookDeliveries",
		replay: "replayWebhookDelivery"
	},
	schedule: {
		get: "getSchedule",
		set: "putSchedule"
	},
	slots: { list: "getSlots" },
	contacts: {
		list: "contactsList",
		get: "contactsGet",
		create: "contactsCreate",
		delete: "contactsDelete"
	},
	polls: {
		list: "listPolls",
		get: "getPoll",
		create: "createPoll",
		delete: "deletePoll"
	},
	teams: {
		list: "orgsListTeams",
		get: "orgsGetTeam"
	},
	members: { list: "orgsListMembers" }
};
var HELP = `calendoro ${CLI_VERSION}: Calendoro from your terminal.

  login [--api-key KEY] [--api-url URL] [--profile NAME]   Sign in with your browser, or save an API key
  logout [--profile NAME]                                  Forget a saved profile
  whoami                                                   Who this credential is, its mode and scopes
  profiles [use NAME]                                      List profiles or switch to one

  ${Object.entries(FRIENDLY).map(([r, v]) => `${r} ${Object.keys(v).join("|")}`).join("\n  ")}
  api <operationId> [--<param> value] [--data JSON|@file|-]   Any of ${Object.keys(cliRoutes).length} API operations; "calendoro api" lists them

  webhooks listen [--forward-to URL] [--events a,b]        Stream signed events and forward them to a local URL
  webhooks trigger <event> [--listener ID]                 Send a sample event
  logs tail [--status N] [--method M] [--route R]          Follow API request logs
  logs list                                                Recent API request logs
  mcp install --client ${MCP_CLIENTS.join("|")} [--print]    Add Calendoro to an MCP client
  completion bash|zsh|fish                                 Print a shell completion script

Common flags:
  --json                 Print the raw JSON response
  --all                  Follow nextCursor through every page of a list
  --limit N --cursor C   Page through a list yourself
  --idempotency-key K    Your own Idempotency-Key, so a retry after a crash cannot repeat the action
  --no-idempotency       Do not send the Idempotency-Key the CLI otherwise generates
  --profile NAME         Use this profile. CALENDORO_API_KEY and CALENDORO_API_URL override saved ones.
`;
var RESERVED = /* @__PURE__ */ new Set([
	"json",
	"all",
	"data",
	"profile",
	"api-url",
	"idempotency-key",
	"no-idempotency",
	"help"
]);
var pathParams = (path) => [...path.matchAll(/:(\w+)/g)].map((m) => m[1]);
function hintFor(e) {
	if (e.status === 401) return "Your credential is missing, expired or revoked. Run `calendoro login`.";
	if (e.status === 403 && e.message.startsWith("missing scope")) return `This key lacks that scope. Create a key that has it, or run \`calendoro whoami\` to see what it holds.`;
	if (e.status === 403 && e.message.includes("user session")) return "This operation is only available signed in to the web app.";
	if (e.status === 403 && e.details?.reason === "sandbox_unavailable") return "Use a live key for this one: test keys stay away from real outside services.";
	if (e.status === 402) return "Your plan does not include this. See Billing in the app.";
	if (e.status === 404) return "Check the id. A `cdo_test_` key sees only test data, and a live key only live data.";
	if (e.status === 409 && e.message.includes("Idempotency-Key")) return "Use a new --idempotency-key for a different request.";
	if (e.status === 429) return "Rate limited. Wait a moment and try again.";
}
function resolveSession(p, io, config, path) {
	const named = flagString(p, "profile") ?? io.env["CALENDORO_PROFILE"];
	const key = named ? void 0 : io.env["CALENDORO_API_KEY"];
	if (key) {
		const apiUrl = flagString(p, "api-url") ?? io.env["CALENDORO_API_URL"] ?? "https://api.calendoro.app";
		assertSafeApiUrl(apiUrl);
		return {
			profile: {
				apiUrl: apiUrl.replace(/\/+$/, ""),
				token: key,
				kind: "api_key"
			},
			fetch: io.fetch
		};
	}
	const s = savedSession(path, config, named ?? config.current, io.fetch);
	if (!s) throw new Error(named ? `No profile named "${named}". See \`calendoro profiles\`.` : "You are not signed in. Run `calendoro login`, or set CALENDORO_API_KEY.");
	const override = flagString(p, "api-url");
	if (override) {
		assertSafeApiUrl(override);
		return {
			...s,
			profile: {
				...s.profile,
				apiUrl: override.replace(/\/+$/, "")
			}
		};
	}
	return s;
}
async function readData(p, io) {
	const raw = flagString(p, "data");
	if (raw === void 0) return void 0;
	let text = raw;
	if (raw === "-") text = await io.readStdin?.() ?? "";
	else if (raw.startsWith("@")) {
		const { readFileSync } = await import("node:fs");
		text = readFileSync(raw.slice(1), "utf8");
	}
	try {
		return JSON.parse(text);
	} catch {
		throw new Error(`--data is not valid JSON: ${text.slice(0, 80)}`);
	}
}
/** Lists print as a table of the fields people look for; everything else as indented JSON. */
function render(value, io, json) {
	if (value === void 0) return;
	if (typeof value === "string") return io.out(value);
	if (json) return io.out(JSON.stringify(value, null, 2));
	const items = Array.isArray(value) ? value : value.data;
	if (Array.isArray(items) && items.every((x) => typeof x === "object" && x !== null)) {
		if (items.length === 0) return io.out("Nothing found.");
		const fields = [
			"id",
			"title",
			"name",
			"slug",
			"status",
			"url",
			"startAt",
			"email"
		].filter((f) => items.some((x) => x[f] !== void 0)).slice(0, 5);
		if (fields.length > 0) {
			for (const x of items) io.out(fields.map((f) => String(x[f] ?? "-")).join("  "));
			const next = value.nextCursor;
			if (next) io.err(`More results: add --cursor ${next}, or --all.`);
			return;
		}
	}
	io.out(JSON.stringify(value, null, 2));
}
async function runOperation(op, route, positional, p, io, s) {
	const params = pathParams(route.path);
	const values = /* @__PURE__ */ new Map();
	params.forEach((name, i) => {
		const v = flagString(p, name) ?? positional[i];
		if (v === void 0) throw new Error(`${op} needs ${params.map((x) => `<${x}>`).join(" ")}: ${route.method} ${route.path}`);
		values.set(name, v);
	});
	const path = route.path.replace(/:(\w+)/g, (_, k) => encodeURIComponent(values.get(k) ?? ""));
	const query = {};
	for (const [k, v] of Object.entries(p.flags)) if (!RESERVED.has(k) && !values.has(k) && typeof v === "string") query[k] = v;
	const sendBody = await readData(p, io) ?? (route.method === "POST" ? {} : void 0);
	const input = {
		method: route.method,
		path,
		query,
		...sendBody !== void 0 ? { body: sendBody } : {},
		idempotencyKey: idempotencyKeyFor(route.idempotent, flagString(p, "idempotency-key"), p.flags["no-idempotency"] === true)
	};
	if (p.flags["all"] === true) return render(await callAll(s, input), io, p.flags["json"] === true);
	return render(await call(s, input), io, p.flags["json"] === true);
}
async function login(p, io, config, path) {
	const apiUrl = (flagString(p, "api-url") ?? io.env["CALENDORO_API_URL"] ?? "https://api.calendoro.app").replace(/\/+$/, "");
	assertSafeApiUrl(apiUrl);
	const name = flagString(p, "profile") ?? config.current;
	const given = p.flags["api-key"];
	let profile;
	if (given !== void 0) {
		const key = (typeof given === "string" ? given : await io.readStdin?.() ?? "").trim();
		if (!key.startsWith("cdo_")) throw new Error("That does not look like an API key: they start with cdo_ or cdo_test_. Create one under API keys in the app.");
		profile = {
			apiUrl,
			token: key,
			kind: "api_key"
		};
	} else {
		const r = await browserLogin(apiUrl, io.fetch, io.err, p.flags["no-browser"] === true ? () => {} : io.open ?? openBrowser);
		profile = {
			apiUrl,
			token: r.accessToken,
			kind: "oauth",
			clientId: CLI_CLIENT_ID,
			...r.refreshToken ? { refreshToken: r.refreshToken } : {}
		};
	}
	const me = await call({
		profile,
		fetch: io.fetch
	}, {
		method: "GET",
		path: "/v1/me"
	});
	config.profiles[name] = profile;
	config.current = name;
	saveConfig(path, config);
	io.out(`Signed in as ${me.user.email} (${me.credential.sandbox ? "test" : "live"} mode). Saved to profile "${name}" in ${path}.`);
}
async function logsCommand(verb, p, io, s) {
	const filter = {};
	for (const k of [
		"status",
		"method",
		"route",
		"mode",
		"keyId",
		"requestId"
	]) {
		const v = flagString(p, k);
		if (v) filter[k] = v;
	}
	const print = (r) => io.out(p.flags["json"] === true ? JSON.stringify(r) : `${r.createdAt}  ${r.mode ?? "live"}  ${String(r.status)}  ${r.method.padEnd(6)} ${r.route}  ${r.latencyMs}ms  ${r.requestId ?? ""}`.trimEnd());
	if (verb === "list") {
		const page = await call(s, {
			method: "GET",
			path: "/v1/developer/request-logs",
			query: {
				limit: flagString(p, "limit") ?? 50,
				...filter
			}
		});
		for (const r of [...page.data].reverse()) print(r);
		return;
	}
	if (verb !== "tail") throw new Error("Use `calendoro logs tail` or `calendoro logs list`.");
	io.err("Following request logs. Press Ctrl-C to stop.");
	if (await tailStream(s, filter, io, print)) return;
	const interval = Math.max(500, Number(flagString(p, "interval") ?? 2e3) || 2e3);
	const sleep = io.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
	let from = (/* @__PURE__ */ new Date(Date.now() - 6e4)).toISOString();
	const seen = /* @__PURE__ */ new Set();
	while (!io.signal.aborted) {
		const page = await call(s, {
			method: "GET",
			path: "/v1/developer/request-logs",
			query: {
				limit: 200,
				from,
				...filter
			}
		});
		for (const r of [...page.data].reverse()) {
			if (seen.has(r.id)) continue;
			seen.add(r.id);
			print(r);
			if (r.createdAt > from) from = r.createdAt;
		}
		if (seen.size > 5e3) seen.clear();
		await sleep(interval);
	}
}
/** Follows GET /v1/developer/request-logs/stream, reconnecting with Last-Event-ID. False when the server has no stream (404). */
async function tailStream(s, filter, io, print) {
	const url = `${s.profile.apiUrl}/v1/developer/request-logs/stream?${new URLSearchParams(filter)}`;
	let lastId = "";
	while (!io.signal.aborted) {
		try {
			const res = await s.fetch(url, {
				headers: {
					...authHeaders(s.profile),
					accept: "text/event-stream",
					...lastId ? { "last-event-id": lastId } : {}
				},
				signal: io.signal
			});
			if (res.status === 404) return false;
			if (res.status === 401 || res.status === 403) throw new Error(`The log stream was refused (HTTP ${res.status}). The credential needs audit:read and an owner, admin or developer role.`);
			if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
			let closed;
			const feed = sseParser((e) => {
				if (e.event === "closed") closed = JSON.parse(e.data).code;
				if (e.event !== "log") return;
				if (e.id) lastId = e.id;
				print(JSON.parse(e.data));
			});
			const decoder = new TextDecoder();
			for await (const chunk of res.body) feed(decoder.decode(chunk, { stream: true }));
			if (closed === "unauthorized" || closed === "forbidden") throw new Error("The credential was revoked or lost access, so the log stream ended.");
		} catch (e) {
			if (io.signal.aborted) return true;
			if (e instanceof Error && /refused|revoked/.test(e.message)) throw e;
			io.err(`Connection lost (${e instanceof Error ? e.message : String(e)}). Reconnecting...`);
		}
		if (!io.signal.aborted) await (io.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms))))(2e3);
	}
	return true;
}
function mcpCommand(p, io, config, path) {
	const client = flagString(p, "client");
	if (!client || !MCP_CLIENTS.includes(client)) throw new Error(`Name a client: calendoro mcp install --client ${MCP_CLIENTS.join("|")}`);
	const key = io.env["CALENDORO_API_KEY"];
	const profile = config.profiles[flagString(p, "profile") ?? config.current];
	const apiKey = key ?? (profile?.kind === "api_key" ? profile.token : void 0);
	const apiUrl = (flagString(p, "api-url") ?? io.env["CALENDORO_API_URL"] ?? profile?.apiUrl ?? "https://api.calendoro.app").replace(/\/+$/, "");
	assertSafeApiUrl(apiUrl);
	const entry = mcpServerEntry(client, apiUrl, apiKey);
	const prompted = client === "vscode" && apiKey !== void 0;
	if (p.flags["print"] === true) return io.out(JSON.stringify(prompted ? {
		inputs: [VSCODE_KEY_INPUT],
		servers: { calendoro: entry }
	} : { calendoro: entry }, null, 2));
	const target = mcpConfigPath(client, io.home, io.cwd, io.platform, io.env["APPDATA"]);
	mcpInstall(target, client, entry);
	io.out(`Added Calendoro to ${target}. Restart ${client} to pick it up.${prompted ? " VS Code asks for your API key when it starts the server; the file does not hold it." : apiKey ? " That file now holds your API key, so keep it out of version control." : " It signs in with your browser the first time."}`);
}
function completionWords(words) {
	const top = [
		"login",
		"logout",
		"whoami",
		"profiles",
		"api",
		"logs",
		"mcp",
		"completion",
		...Object.keys(FRIENDLY)
	];
	const [first, second] = words;
	if (words.length <= 1) return top.filter((w) => w.startsWith(first ?? ""));
	const partial = words[words.length - 1] ?? "";
	if (words.length > 2) return [];
	return (first === "api" ? Object.keys(cliRoutes) : first === "logs" ? ["tail", "list"] : first === "mcp" ? ["install"] : first === "completion" ? [
		"bash",
		"zsh",
		"fish"
	] : first === "profiles" ? ["use"] : first === "webhooks" ? [
		...Object.keys(FRIENDLY["webhooks"] ?? {}),
		"listen",
		"trigger"
	] : Object.keys(FRIENDLY[first ?? ""] ?? {})).filter((w) => w.startsWith(second ?? partial));
}
function completionScript(shell) {
	if (shell === "bash") return `_calendoro() { COMPREPLY=($(calendoro __complete "\${COMP_WORDS[@]:1}")); }\ncomplete -F _calendoro calendoro`;
	if (shell === "zsh") return `#compdef calendoro\n_calendoro() { compadd -- $(calendoro __complete "\${words[@]:1}") }\ncompdef _calendoro calendoro`;
	if (shell === "fish") return `complete -c calendoro -f -a '(calendoro __complete (commandline -opc)[2..-1] (commandline -ct))'`;
	throw new Error("Use `calendoro completion bash`, `zsh` or `fish`.");
}
async function dispatch(p, io) {
	const [cmd, sub, ...rest] = p.positional;
	const path = configPath(io.env);
	if (p.flags["version"] === true) return io.out(CLI_VERSION);
	if (cmd === "__complete") return io.out(completionWords(p.positional.slice(1)).join("\n"));
	if (!cmd || cmd === "help" || p.flags["help"] === true) return io.out(HELP);
	if (cmd === "completion") return io.out(completionScript(sub ?? ""));
	const config = loadConfig(path);
	if (cmd === "login") return login(p, io, config, path);
	if (cmd === "logout") {
		const name = flagString(p, "profile") ?? config.current;
		delete config.profiles[name];
		saveConfig(path, config);
		return io.out(`Removed profile "${name}". An API key stays valid until you revoke it in the app.`);
	}
	if (cmd === "profiles") {
		if (sub === "use") {
			const name = rest[0];
			if (!name || !config.profiles[name]) throw new Error(`No profile named "${name ?? ""}".`);
			config.current = name;
			saveConfig(path, config);
			return io.out(`Now using "${name}".`);
		}
		const names = Object.entries(config.profiles);
		if (names.length === 0) return io.out("No profiles. Run `calendoro login`.");
		for (const [name, prof] of names) io.out(`${name === config.current ? "*" : " "} ${name}  ${prof.apiUrl}  ${prof.kind}${prof.token.startsWith("cdo_test_") ? " (test)" : ""}`);
		return;
	}
	if (cmd === "mcp") {
		if (sub !== "install") throw new Error("Use `calendoro mcp install --client <client>`.");
		return mcpCommand(p, io, config, path);
	}
	if (cmd === "api" && !sub) {
		for (const [op, r] of Object.entries(cliRoutes)) io.out(`${op.padEnd(36)} ${r.method.padEnd(6)} ${r.path}  ${r.summary}`);
		return;
	}
	const s = resolveSession(p, io, config, path);
	if (cmd === "whoami") {
		const me = await call(s, {
			method: "GET",
			path: "/v1/me"
		});
		if (p.flags["json"] === true) return io.out(JSON.stringify(me, null, 2));
		return io.out(`${me.user.name} <${me.user.email}>\nOrganization: ${me.organizationId}\nCredential: ${me.credential.kind}, ${me.credential.sandbox ? "test" : "live"} mode\nScopes: ${me.credential.scopes.join(" ")}\nAPI: ${s.profile.apiUrl}`);
	}
	if (cmd === "logs") return logsCommand(sub, p, io, s);
	if (cmd === "webhooks" && sub === "listen") {
		const forwardTo = flagString(p, "forward-to");
		if (forwardTo) new URL(forwardTo);
		return listen(s, {
			forwardTo,
			events: flagString(p, "events")?.split(",").filter(Boolean) ?? [],
			json: p.flags["json"] === true,
			out: io.out,
			err: io.err,
			signal: io.signal
		});
	}
	if (cmd === "webhooks" && sub === "trigger" || cmd === "trigger") {
		const type = cmd === "trigger" ? sub : rest[0];
		if (!type) throw new Error("Name an event: calendoro webhooks trigger booking.created");
		const listenerId = flagString(p, "listener");
		const r = await call(s, {
			method: "POST",
			path: "/v1/developer/events/trigger",
			body: {
				type,
				...listenerId ? { listenerId } : {}
			}
		});
		return io.out(p.flags["json"] === true ? JSON.stringify(r) : `Sent a sample ${type} (${r.mode} mode): ${r.delivery === "your_listeners_only" ? "to your running listeners only" : "to test endpoints and test listeners"}.`);
	}
	if (cmd === "api") {
		const route = cliRoutes[sub];
		if (!route) throw new Error(`Unknown operation "${sub}". Run \`calendoro api\` to list them.${Object.keys(cliRoutes).some((o) => o.toLowerCase() === sub?.toLowerCase()) ? " Names are case-sensitive." : ""}`);
		return runOperation(sub, route, rest, p, io, s);
	}
	const verbs = FRIENDLY[cmd];
	if (!verbs) throw new Error(`Unknown command "${cmd}". Run \`calendoro help\`.`);
	const op = verbs[sub ?? ""];
	if (!op) throw new Error(`Use: calendoro ${cmd} ${Object.keys(verbs).join("|")}`);
	const route = cliRoutes[op];
	if (!route) throw new Error(`${op} is not available to API credentials`);
	return runOperation(op, route, rest, p, io, s);
}
/** Returns the process exit code. */
async function run(argv, io) {
	const p = parseArgs(argv);
	try {
		await dispatch(p, io);
		return 0;
	} catch (e) {
		if (e instanceof CliApiError) {
			if (p.flags["json"] === true) io.err(JSON.stringify({ error: {
				status: e.status,
				code: e.code,
				message: e.message,
				details: e.details,
				requestId: e.requestId
			} }));
			else {
				io.err(`Error ${e.status} ${e.code}: ${e.message}`);
				if (e.code === "validation_failed" && Array.isArray(e.details)) for (const i of e.details) io.err(`  ${(i.path ?? []).join(".")}: ${i.message ?? ""}`);
				const hint = hintFor(e);
				if (hint) io.err(hint);
				if (e.requestId) io.err(`Request id: ${e.requestId}`);
			}
			return 1;
		}
		io.err(e instanceof Error ? e.message : String(e));
		return 1;
	}
}
// packages/cli/src/bin.ts
var stop = new AbortController();
process.on("SIGINT", () => stop.abort());
process.on("SIGTERM", () => stop.abort());
var readStdin = async () => {
	let text = "";
	for await (const chunk of process.stdin) text += String(chunk);
	return text;
};
var code = await run(process.argv.slice(2), {
	env: process.env,
	fetch: globalThis.fetch,
	out: (s) => void process.stdout.write(`${s}\n`),
	err: (s) => void process.stderr.write(`${s}\n`),
	cwd: process.cwd(),
	home: homedir(),
	platform: process.platform,
	signal: stop.signal,
	readStdin
});
process.exit(code);
