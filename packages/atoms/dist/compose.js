// packages/atoms/src/compose.ts
var ATOMS_EN = {
	apiAddress: "API address",
	signIn: "Sign in",
	useKey: "Use an API key instead",
	apiKey: "API key (scopes: {scopes})",
	eventType: "Event type",
	createLink: "Create link",
	createPoll: "Create a poll",
	textToSend: "Text to send",
	insertEmail: "Insert in email",
	copy: "Copy",
	disconnect: "Disconnect",
	insertLink: "Insert link and times",
	insertPoll: "Insert a poll",
	enterHttps: "Enter an https address.",
	needAccess: "Calendoro needs access to that address.",
	creating: "Creating link…",
	creatingPoll: "Creating poll…",
	inserted: "Inserted.",
	notInCompose: "Click in a compose box in Gmail or Outlook first, or use Copy.",
	copied: "Copied.",
	failed: "Something went wrong.",
	cancelled: "Sign-in was cancelled.",
	timesThatWork: "Times that work ({tz}):",
	pollVote: "Vote for the times that work for you.",
	noTimes: "No open times in the next week.",
	singleUse: "Single-use link",
	oneOff: "One-off meeting",
	creatingOneOff: "Creating one-off meeting…",
	upcoming: "Upcoming meetings",
	noUpcoming: "No upcoming meetings."
};
/** UI text for the extension popup and the Outlook pane, in the six full languages. The Gmail add-on keeps its own copy, as Apps Script can't import. */
var ATOMS_STRINGS = {
	en: ATOMS_EN,
	es: {
		apiAddress: "Dirección de la API",
		signIn: "Iniciar sesión",
		useKey: "Usar una clave de API",
		apiKey: "Clave de API (permisos: {scopes})",
		eventType: "Tipo de evento",
		createLink: "Crear enlace",
		createPoll: "Crear encuesta",
		textToSend: "Texto para enviar",
		insertEmail: "Insertar en el correo",
		copy: "Copiar",
		disconnect: "Desconectar",
		insertLink: "Insertar enlace y horarios",
		insertPoll: "Insertar encuesta",
		enterHttps: "Introduce una dirección https.",
		needAccess: "Calendoro necesita acceso a esa dirección.",
		creating: "Creando enlace…",
		creatingPoll: "Creando encuesta…",
		inserted: "Insertado.",
		notInCompose: "Haz clic primero en un cuadro de redacción de Gmail u Outlook, o usa Copiar.",
		copied: "Copiado.",
		failed: "Algo salió mal.",
		cancelled: "Se canceló el inicio de sesión.",
		timesThatWork: "Horarios disponibles ({tz}):",
		pollVote: "Vota los horarios que te vengan bien.",
		noTimes: "No hay horarios libres en la próxima semana.",
		singleUse: "Enlace de un solo uso",
		oneOff: "Reunión puntual",
		creatingOneOff: "Creando reunión puntual…",
		upcoming: "Próximas reuniones",
		noUpcoming: "No hay reuniones próximas."
	},
	fr: {
		apiAddress: "Adresse de l'API",
		signIn: "Se connecter",
		useKey: "Utiliser une clé d'API",
		apiKey: "Clé d'API (autorisations : {scopes})",
		eventType: "Type d'événement",
		createLink: "Créer un lien",
		createPoll: "Créer un sondage",
		textToSend: "Texte à envoyer",
		insertEmail: "Insérer dans l'e-mail",
		copy: "Copier",
		disconnect: "Se déconnecter",
		insertLink: "Insérer le lien et les créneaux",
		insertPoll: "Insérer un sondage",
		enterHttps: "Saisissez une adresse https.",
		needAccess: "Calendoro a besoin d'accéder à cette adresse.",
		creating: "Création du lien…",
		creatingPoll: "Création du sondage…",
		inserted: "Inséré.",
		notInCompose: "Cliquez d'abord dans une fenêtre de rédaction Gmail ou Outlook, ou utilisez Copier.",
		copied: "Copié.",
		failed: "Une erreur s'est produite.",
		cancelled: "Connexion annulée.",
		timesThatWork: "Créneaux disponibles ({tz}) :",
		pollVote: "Votez pour les créneaux qui vous conviennent.",
		noTimes: "Aucun créneau libre la semaine prochaine.",
		singleUse: "Lien à usage unique",
		oneOff: "Rendez-vous ponctuel",
		creatingOneOff: "Création du rendez-vous ponctuel…",
		upcoming: "Prochains rendez-vous",
		noUpcoming: "Aucun rendez-vous à venir."
	},
	de: {
		apiAddress: "API-Adresse",
		signIn: "Anmelden",
		useKey: "Stattdessen einen API-Schlüssel verwenden",
		apiKey: "API-Schlüssel (Berechtigungen: {scopes})",
		eventType: "Terminart",
		createLink: "Link erstellen",
		createPoll: "Umfrage erstellen",
		textToSend: "Zu sendender Text",
		insertEmail: "In E-Mail einfügen",
		copy: "Kopieren",
		disconnect: "Trennen",
		insertLink: "Link und Zeiten einfügen",
		insertPoll: "Umfrage einfügen",
		enterHttps: "Geben Sie eine https-Adresse ein.",
		needAccess: "Calendoro braucht Zugriff auf diese Adresse.",
		creating: "Link wird erstellt…",
		creatingPoll: "Umfrage wird erstellt…",
		inserted: "Eingefügt.",
		notInCompose: "Klicken Sie zuerst in ein Verfassen-Feld in Gmail oder Outlook, oder nutzen Sie Kopieren.",
		copied: "Kopiert.",
		failed: "Etwas ist schiefgelaufen.",
		cancelled: "Anmeldung abgebrochen.",
		timesThatWork: "Passende Zeiten ({tz}):",
		pollVote: "Stimmen Sie für die Zeiten ab, die Ihnen passen.",
		noTimes: "Keine freien Zeiten in der nächsten Woche.",
		singleUse: "Einmal-Link",
		oneOff: "Einmaliger Termin",
		creatingOneOff: "Einmaliger Termin wird erstellt…",
		upcoming: "Anstehende Termine",
		noUpcoming: "Keine anstehenden Termine."
	},
	"pt-BR": {
		apiAddress: "Endereço da API",
		signIn: "Entrar",
		useKey: "Usar uma chave de API",
		apiKey: "Chave de API (escopos: {scopes})",
		eventType: "Tipo de evento",
		createLink: "Criar link",
		createPoll: "Criar enquete",
		textToSend: "Texto para enviar",
		insertEmail: "Inserir no e-mail",
		copy: "Copiar",
		disconnect: "Desconectar",
		insertLink: "Inserir link e horários",
		insertPoll: "Inserir enquete",
		enterHttps: "Digite um endereço https.",
		needAccess: "O Calendoro precisa de acesso a esse endereço.",
		creating: "Criando link…",
		creatingPoll: "Criando enquete…",
		inserted: "Inserido.",
		notInCompose: "Clique primeiro em uma caixa de composição do Gmail ou do Outlook, ou use Copiar.",
		copied: "Copiado.",
		failed: "Algo deu errado.",
		cancelled: "O login foi cancelado.",
		timesThatWork: "Horários disponíveis ({tz}):",
		pollVote: "Vote nos horários que funcionam para você.",
		noTimes: "Nenhum horário livre na próxima semana.",
		singleUse: "Link de uso único",
		oneOff: "Reunião avulsa",
		creatingOneOff: "Criando reunião avulsa…",
		upcoming: "Próximas reuniões",
		noUpcoming: "Nenhuma reunião próxima."
	},
	ja: {
		apiAddress: "API アドレス",
		signIn: "サインイン",
		useKey: "代わりに API キーを使う",
		apiKey: "API キー(スコープ: {scopes})",
		eventType: "イベントタイプ",
		createLink: "リンクを作成",
		createPoll: "日程調整の投票を作成",
		textToSend: "送信するテキスト",
		insertEmail: "メールに挿入",
		copy: "コピー",
		disconnect: "接続を解除",
		insertLink: "リンクと候補日時を挿入",
		insertPoll: "投票を挿入",
		enterHttps: "https のアドレスを入力してください。",
		needAccess: "Calendoro にそのアドレスへのアクセスを許可してください。",
		creating: "リンクを作成中…",
		creatingPoll: "投票を作成中…",
		inserted: "挿入しました。",
		notInCompose: "先に Gmail または Outlook の作成欄をクリックするか、コピーを使ってください。",
		copied: "コピーしました。",
		failed: "問題が発生しました。",
		cancelled: "サインインがキャンセルされました。",
		timesThatWork: "ご都合のよい日時({tz}):",
		pollVote: "ご都合のよい日時に投票してください。",
		noTimes: "今後 1 週間に空き時間がありません。",
		singleUse: "1 回限りのリンク",
		oneOff: "単発のミーティング",
		creatingOneOff: "単発のミーティングを作成中…",
		upcoming: "今後のミーティング",
		noUpcoming: "今後のミーティングはありません。"
	}
};
/** Picks the strings for a browser language tag: exact match, then the base language (pt goes to pt-BR), then English. */
function atomsStrings(tag) {
	const t = (tag ?? "en").replace("_", "-");
	const base = t.split("-")[0]?.toLowerCase() ?? "en";
	return ATOMS_STRINGS[Object.keys(ATOMS_STRINGS).find((k) => k.toLowerCase() === t.toLowerCase()) ?? (base === "pt" ? "pt-BR" : base)] ?? ATOMS_EN;
}
/** Plain-text insert: the link, plus a few suggested times in the sender's zone. */
function atomsComposeText(o) {
	const fmt = new Intl.DateTimeFormat(o.locale ?? "en", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: o.timeZone
	});
	const times = o.slots.map((s) => `- ${fmt.format(new Date(s))}: ${o.url}?slot=${encodeURIComponent(s)}`);
	return [`${o.title}: ${o.url}`, ...times.length ? [
		"",
		atomsStrings(o.locale).timesThatWork.replace("{tz}", o.timeZone),
		...times
	] : []].join("\n");
}
/** Plain-text insert for a poll: its public link and a line asking people to vote. */
function atomsComposePollText(o) {
	return `${o.title}: ${o.url}\n\n${atomsStrings(o.locale).pollVote}`;
}
var iso = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
/** Creates a slots poll from the sender's free times in the next week, for the event type's length. Needs scopes polls:read and polls:write. */
async function atomsCreatePoll(client, eventType, o) {
	const now = o.now ?? Date.now();
	const slots = (await client.getPollFreeSlots({ query: {
		start: iso(now),
		end: iso(now + 6048e5),
		durationMinutes: eventType.durationMinutes
	} })).slots.slice(0, o.maxSlots ?? 8);
	if (!slots.length) throw new Error(atomsStrings(o.locale).noTimes);
	return {
		url: (await client.createPoll({ body: {
			title: eventType.title,
			durationMinutes: eventType.durationMinutes,
			timeZone: o.timeZone,
			mode: "slots",
			slots
		} })).poll.publicUrl,
		slots
	};
}
/** Creates a shareable link to the event type, and reads the next open times. Needs scopes event_types:write and availability:read. */
async function atomsCreateShareLink(client, eventType, o) {
	const now = o.now ?? Date.now();
	const [link, free] = await Promise.all([client.createLink({ body: {
		eventTypeId: eventType.id,
		label: "Shared from email",
		singleUse: o.singleUse ?? false
	} }), client.getSlots({ query: {
		eventTypeId: eventType.id,
		start: iso(now),
		end: iso(now + 6048e5),
		timeZone: o.timeZone
	} })]);
	return {
		link,
		slots: free.slots.slice(0, o.maxSlots ?? 5)
	};
}
/** A one-off meeting offering the next open times of an event type: the invitee picks one, then the link is used up. Needs event_types:write and availability:read. */
async function atomsCreateOneOff(client, eventType, o) {
	const now = o.now ?? Date.now();
	const slots = (await client.getSlots({ query: {
		eventTypeId: eventType.id,
		start: iso(now),
		end: iso(now + 6048e5),
		timeZone: o.timeZone
	} })).slots.slice(0, o.maxSlots ?? 5);
	if (!slots.length) throw new Error(atomsStrings(o.locale).noTimes);
	return {
		link: await client.createOneOffLink({ body: {
			title: eventType.title,
			durationMinutes: eventType.durationMinutes,
			candidates: slots,
			label: "One-off from email"
		} }),
		slots
	};
}
/** The next confirmed bookings the signed-in user can see. Needs bookings:read. */
async function atomsUpcoming(client, o = {}) {
	return (await client.listBookings({ query: {
		from: iso(o.now ?? Date.now()),
		status: "confirmed",
		order: "asc",
		limit: o.limit ?? 5
	} })).data.map((b) => ({
		id: b.id,
		startAt: b.startAt,
		invitee: b.invitee.name
	}));
}
/** One line per meeting, in the reader's zone and language. */
function atomsUpcomingText(items, o) {
	if (items.length === 0) return atomsStrings(o.locale).noUpcoming;
	const fmt = new Intl.DateTimeFormat(o.locale ?? "en", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: o.timeZone
	});
	return items.map((b) => `${fmt.format(new Date(b.startAt))} · ${b.invitee}`).join("\n");
}
/** API origins a user may configure: https, or http on localhost for development. Returns the normalized base URL or null. */
function atomsParseApiUrl(input) {
	if (!URL.canParse(input.trim())) return null;
	const u = new URL(input.trim());
	const local = ["localhost", "127.0.0.1"].includes(u.hostname);
	if (u.protocol !== "https:" && !(u.protocol === "http:" && local)) return null;
	return `${u.origin}${u.pathname.replace(/\/+$/, "")}`;
}
var ATOMS_SHARE_SCOPES = "event_types:read event_types:write availability:read polls:read polls:write bookings:read";
var base64Url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function atomsCreatePkce() {
	const verifier = base64Url(crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(48)));
	return {
		verifier,
		challenge: base64Url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))),
		state: base64Url(crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(16)))
	};
}
async function oauthJson(res) {
	const json = await res.json().catch(() => ({}));
	if (!res.ok) throw new Error(typeof json["error_description"] === "string" ? json["error_description"] : "Sign-in failed.");
	return json;
}
/** RFC 7591: each install registers itself as a public client for its own redirect address. */
async function atomsRegisterClient(apiUrl, name, redirectUri) {
	const json = await oauthJson(await fetch(`${apiUrl}/oauth/register`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			client_name: name,
			redirect_uris: [redirectUri],
			token_endpoint_auth_method: "none",
			grant_types: ["authorization_code", "refresh_token"],
			response_types: ["code"],
			scope: ATOMS_SHARE_SCOPES
		})
	}));
	if (typeof json["client_id"] !== "string") throw new Error("Sign-in failed.");
	return json["client_id"];
}
/** The query of an authorization request. `{base}/oauth/authorize` on the API, or `{web}/oauth/consent` from a dialog that must stay on the web app's domain. */
function atomsAuthorizeQuery(clientId, redirectUri, pkce) {
	return new URLSearchParams({
		response_type: "code",
		client_id: clientId,
		redirect_uri: redirectUri,
		scope: ATOMS_SHARE_SCOPES,
		state: pkce.state,
		code_challenge: pkce.challenge,
		code_challenge_method: "S256"
	}).toString();
}
/** The code from a redirect's query. Throws when the user said no or the state isn't ours. */
function atomsCodeFromRedirect(search, state) {
	const q = new URLSearchParams(search);
	if (q.get("state") !== state) throw new Error("Sign-in failed. Please try again.");
	const code = q.get("code");
	if (!code) throw new Error(q.get("error_description") ?? "Sign-in was cancelled.");
	return code;
}
async function tokenRequest(apiUrl, form, now) {
	const json = await oauthJson(await fetch(`${apiUrl}/oauth/token`, {
		method: "POST",
		headers: { "content-type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams(form).toString()
	}));
	return {
		accessToken: String(json["access_token"]),
		refreshToken: String(json["refresh_token"]),
		expiresAt: now + Number(json["expires_in"]) * 1e3
	};
}
function atomsExchangeCode(apiUrl, clientId, redirectUri, code, verifier, now = Date.now()) {
	return tokenRequest(apiUrl, {
		grant_type: "authorization_code",
		client_id: clientId,
		redirect_uri: redirectUri,
		code,
		code_verifier: verifier
	}, now);
}
/** Refresh tokens rotate, so the caller must save what this returns. Keeps a minute's margin. */
async function atomsFreshTokens(apiUrl, clientId, tokens, now = Date.now()) {
	if (tokens.expiresAt - now > 6e4) return tokens;
	return tokenRequest(apiUrl, {
		grant_type: "refresh_token",
		client_id: clientId,
		refresh_token: tokens.refreshToken
	}, now);
}
export { ATOMS_SHARE_SCOPES, ATOMS_STRINGS, atomsAuthorizeQuery, atomsCodeFromRedirect, atomsComposePollText, atomsComposeText, atomsCreateOneOff, atomsCreatePkce, atomsCreatePoll, atomsCreateShareLink, atomsExchangeCode, atomsFreshTokens, atomsParseApiUrl, atomsRegisterClient, atomsStrings, atomsUpcoming, atomsUpcomingText };
