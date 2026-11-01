import { ATOMS_SHARE_SCOPES, ATOMS_STRINGS, atomsAuthorizeQuery, atomsCodeFromRedirect, atomsComposePollText, atomsComposeText, atomsCreateOneOff, atomsCreatePkce, atomsCreatePoll, atomsCreateShareLink, atomsExchangeCode, atomsFreshTokens, atomsParseApiUrl, atomsRegisterClient, atomsStrings, atomsUpcoming, atomsUpcomingText } from "./compose.js";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { createClient } from "@calendoro/sdk";
// packages/atoms/src/embed.tsx
function atomsEmbedUrl(p, pageSearch = "") {
	if (!URL.canParse(p.url)) return null;
	const u = new URL(p.url);
	if (u.protocol !== "https:" && u.protocol !== "http:") return null;
	u.searchParams.set("embed", "1");
	if (p.lang) u.searchParams.set("lang", p.lang);
	if (p.name) u.searchParams.set("name", p.name);
	if (p.email) u.searchParams.set("email", p.email);
	if (p.cssVars) u.searchParams.set("cssVars", JSON.stringify(p.cssVars));
	new URLSearchParams(pageSearch).forEach((v, k) => {
		if (/^utm_[a-z_]{1,40}$/.test(k) && !u.searchParams.has(k)) u.searchParams.set(k, v);
	});
	return u.href;
}
function CalendoroEmbed(props) {
	const { title = "Schedule a meeting", onBooked } = props;
	const ref = useRef(null);
	const [height, setHeight] = useState(700);
	const src = atomsEmbedUrl(props, typeof location === "undefined" ? "" : location.search);
	const origin = src ? new URL(src).origin : null;
	useEffect(() => {
		const listener = (event) => {
			if (event.source !== ref.current?.contentWindow || event.origin !== origin) return;
			const d = event.data;
			if (d?.type === "calendoro:resize" && typeof d.height === "number" && d.height > 0) setHeight(Math.ceil(d.height));
			else if (d?.type === "calendoro:booked") onBooked?.(d.booking);
		};
		window.addEventListener("message", listener);
		return () => window.removeEventListener("message", listener);
	}, [origin, onBooked]);
	if (!src) return null;
	return /* @__PURE__ */ jsx("iframe", {
		ref,
		src,
		title,
		allow: "clipboard-write",
		style: {
			width: "100%",
			border: 0,
			height
		}
	});
}
/** A button that opens the booking page in a native modal dialog. */
function CalendoroPopupButton({ children, closeLabel = "Close", className, ...embed }) {
	const ref = useRef(null);
	const [open, setOpen] = useState(false);
	useEffect(() => {
		if (open) ref.current?.showModal();
	}, [open]);
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("button", {
		type: "button",
		...className ? { className } : {},
		onClick: () => setOpen(true),
		children
	}), open ? /* @__PURE__ */ jsxs("dialog", {
		ref,
		onClose: () => setOpen(false),
		style: {
			width: "min(760px, calc(100vw - 32px))",
			padding: 0,
			border: 0,
			borderRadius: 10
		},
		children: [/* @__PURE__ */ jsx("button", {
			type: "button",
			"aria-label": closeLabel,
			onClick: () => ref.current?.close(),
			style: {
				float: "right",
				margin: 8
			},
			children: /* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				children: "×"
			})
		}), /* @__PURE__ */ jsx(CalendoroEmbed, { ...embed })]
	}) : null] });
}
// packages/atoms/src/booker.tsx
var ATOMS_BOOKER_LABELS = {
	loading: "Loading…",
	date: "Date",
	noTimes: "No times on this date.",
	times: "Available times",
	name: "Your name",
	email: "Email",
	book: "Book",
	booked: "You're booked.",
	failed: "Something went wrong. Please try again."
};
/** The whole local day in UTC instants wide enough for any zone: slots are then filtered to `date` in `timeZone`. */
function atomsDayRange(date) {
	const noon = Date.parse(`${date}T12:00:00Z`);
	const iso = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
	return {
		start: iso(noon - 936e5),
		end: iso(noon + 936e5)
	};
}
function atomsSlotsOnDate(slots, date, timeZone) {
	const day = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	});
	return slots.filter((s) => day.format(new Date(s)) === date);
}
function atomsFilledAnswers(answers) {
	return Object.fromEntries(Object.entries(answers).filter(([, v]) => v.trim() !== ""));
}
var today = (timeZone) => new Intl.DateTimeFormat("en-CA", {
	timeZone,
	year: "numeric",
	month: "2-digit",
	day: "2-digit"
}).format(/* @__PURE__ */ new Date());
function Question({ q, value, onChange }) {
	const id = useId();
	return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
		htmlFor: id,
		children: q.label
	}), q.type === "textarea" ? /* @__PURE__ */ jsx("textarea", {
		id,
		required: q.required,
		value,
		onChange: (e) => onChange(e.target.value)
	}) : q.type === "select" ? /* @__PURE__ */ jsxs("select", {
		id,
		required: q.required,
		value,
		onChange: (e) => onChange(e.target.value),
		children: [/* @__PURE__ */ jsx("option", { value: "" }), (q.options ?? []).map((o) => /* @__PURE__ */ jsx("option", {
			value: o,
			children: o
		}, o))]
	}) : /* @__PURE__ */ jsx("input", {
		id,
		type: q.type === "email" ? "email" : q.type === "phone" ? "tel" : "text",
		required: q.required,
		value,
		onChange: (e) => onChange(e.target.value)
	})] });
}
function CalendoroBooker(p) {
	const labels = {
		...ATOMS_BOOKER_LABELS,
		...p.labels
	};
	const timeZone = p.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
	const client = useMemo(() => createClient({
		baseUrl: p.apiUrl,
		...p.fetch ? { fetch: p.fetch } : {}
	}), [p.apiUrl, p.fetch]);
	const params = useMemo(() => ({
		username: p.username,
		slug: p.slug
	}), [p.username, p.slug]);
	const [page, setPage] = useState(null);
	const [date, setDate] = useState(() => today(timeZone));
	const [slots, setSlots] = useState([]);
	const [slot, setSlot] = useState(null);
	const [name, setName] = useState(p.name ?? "");
	const [email, setEmail] = useState(p.email ?? "");
	const [answers, setAnswers] = useState({});
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState(null);
	const [done, setDone] = useState(false);
	const dateId = useId();
	const nameId = useId();
	const emailId = useId();
	useEffect(() => {
		let live = true;
		client.getPublicPage({ params }).then((r) => live && setPage(r), () => live && setError(labels.failed));
		return () => {
			live = false;
		};
	}, [
		client,
		params,
		labels.failed
	]);
	useEffect(() => {
		let live = true;
		setSlot(null);
		client.getPublicSlots({
			params,
			query: {
				...atomsDayRange(date),
				timeZone
			}
		}).then((r) => live && setSlots(atomsSlotsOnDate(r.slots, date, timeZone)), () => live && setError(labels.failed));
		return () => {
			live = false;
		};
	}, [
		client,
		params,
		date,
		timeZone,
		labels.failed
	]);
	const submit = async (e) => {
		e.preventDefault();
		if (!slot) return;
		setBusy(true);
		setError(null);
		try {
			const b = await client.createPublicBooking({
				params,
				body: {
					startAt: slot,
					timeZone,
					invitee: {
						name,
						email
					},
					answers: atomsFilledAnswers(answers)
				}
			});
			if (b.checkoutUrl) return location.assign(b.checkoutUrl);
			const { manageUrl: _secret, ...safe } = b;
			setDone(true);
			p.onBooked?.(safe);
		} catch (err) {
			setError(err instanceof Error ? err.message : labels.failed);
		} finally {
			setBusy(false);
		}
	};
	if (done) return /* @__PURE__ */ jsx("p", {
		role: "status",
		children: labels.booked
	});
	if (!page) return error ? /* @__PURE__ */ jsx("p", {
		role: "alert",
		children: error
	}) : /* @__PURE__ */ jsx("p", { children: labels.loading });
	const time = new Intl.DateTimeFormat(p.locale ?? "en", {
		timeStyle: "short",
		timeZone
	});
	return /* @__PURE__ */ jsxs("form", {
		onSubmit: (e) => void submit(e),
		children: [
			/* @__PURE__ */ jsx("h2", { children: page.eventType.title }),
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
				htmlFor: dateId,
				children: labels.date
			}), /* @__PURE__ */ jsx("input", {
				id: dateId,
				type: "date",
				value: date,
				onChange: (e) => setDate(e.target.value)
			})] }),
			/* @__PURE__ */ jsxs("fieldset", { children: [
				/* @__PURE__ */ jsx("legend", { children: labels.times }),
				slots.length === 0 ? /* @__PURE__ */ jsx("p", { children: labels.noTimes }) : null,
				slots.map((s) => /* @__PURE__ */ jsxs("label", { children: [/* @__PURE__ */ jsx("input", {
					type: "radio",
					name: "calendoro-slot",
					required: true,
					checked: slot === s,
					onChange: () => setSlot(s)
				}), time.format(new Date(s))] }, s))
			] }),
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
				htmlFor: nameId,
				children: labels.name
			}), /* @__PURE__ */ jsx("input", {
				id: nameId,
				required: true,
				autoComplete: "name",
				value: name,
				onChange: (e) => setName(e.target.value)
			})] }),
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("label", {
				htmlFor: emailId,
				children: labels.email
			}), /* @__PURE__ */ jsx("input", {
				id: emailId,
				type: "email",
				required: true,
				autoComplete: "email",
				value: email,
				onChange: (e) => setEmail(e.target.value)
			})] }),
			page.eventType.questions.map((q) => /* @__PURE__ */ jsx(Question, {
				q,
				value: answers[q.id] ?? "",
				onChange: (v) => setAnswers((a) => ({
					...a,
					[q.id]: v
				}))
			}, q.id)),
			error ? /* @__PURE__ */ jsx("p", {
				role: "alert",
				children: error
			}) : null,
			/* @__PURE__ */ jsx("button", {
				type: "submit",
				disabled: busy || !slot,
				children: labels.book
			})
		]
	});
}
export { ATOMS_BOOKER_LABELS, ATOMS_SHARE_SCOPES, ATOMS_STRINGS, CalendoroBooker, CalendoroEmbed, CalendoroPopupButton, atomsAuthorizeQuery, atomsCodeFromRedirect, atomsComposePollText, atomsComposeText, atomsCreateOneOff, atomsCreatePkce, atomsCreatePoll, atomsCreateShareLink, atomsDayRange, atomsEmbedUrl, atomsExchangeCode, atomsFilledAnswers, atomsFreshTokens, atomsParseApiUrl, atomsRegisterClient, atomsSlotsOnDate, atomsStrings, atomsUpcoming, atomsUpcomingText };
