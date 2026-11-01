import type { Client } from "@calendoro/sdk";
import type { LinksDto, LinksEventTypeDto } from "../../contracts/src/index.js";
export type AtomsComposeEventType = LinksEventTypeDto;
declare const ATOMS_EN: {
    apiAddress: string;
    signIn: string;
    useKey: string;
    apiKey: string;
    eventType: string;
    createLink: string;
    createPoll: string;
    textToSend: string;
    insertEmail: string;
    copy: string;
    disconnect: string;
    insertLink: string;
    insertPoll: string;
    enterHttps: string;
    needAccess: string;
    creating: string;
    creatingPoll: string;
    inserted: string;
    notInCompose: string;
    copied: string;
    failed: string;
    cancelled: string;
    timesThatWork: string;
    pollVote: string;
    noTimes: string;
    singleUse: string;
    oneOff: string;
    creatingOneOff: string;
    upcoming: string;
    noUpcoming: string;
};
export type AtomsStrings = typeof ATOMS_EN;
/** UI text for the extension popup and the Outlook pane, in the six full languages. The Gmail add-on keeps its own copy, as Apps Script can't import. */
export declare const ATOMS_STRINGS: Record<"en" | "es" | "fr" | "de" | "pt-BR" | "ja", AtomsStrings>;
/** Picks the strings for a browser language tag: exact match, then the base language (pt goes to pt-BR), then English. */
export declare function atomsStrings(tag: string | undefined): AtomsStrings;
/** Plain-text insert: the link, plus a few suggested times in the sender's zone. */
export declare function atomsComposeText(o: {
    title: string;
    url: string;
    slots: readonly string[];
    timeZone: string;
    locale?: string;
}): string;
/** Plain-text insert for a poll: its public link and a line asking people to vote. */
export declare function atomsComposePollText(o: {
    title: string;
    url: string;
    locale?: string;
}): string;
/** Creates a slots poll from the sender's free times in the next week, for the event type's length. Needs scopes polls:read and polls:write. */
export declare function atomsCreatePoll(client: Client, eventType: Pick<LinksEventTypeDto, "title" | "durationMinutes">, o: {
    timeZone: string;
    now?: number;
    maxSlots?: number;
    locale?: string;
}): Promise<{
    url: string;
    slots: string[];
}>;
/** Creates a shareable link to the event type, and reads the next open times. Needs scopes event_types:write and availability:read. */
export declare function atomsCreateShareLink(client: Client, eventType: Pick<LinksEventTypeDto, "id" | "title">, o: {
    timeZone: string;
    now?: number;
    maxSlots?: number;
    singleUse?: boolean;
}): Promise<{
    link: LinksDto;
    slots: string[];
}>;
/** A one-off meeting offering the next open times of an event type: the invitee picks one, then the link is used up. Needs event_types:write and availability:read. */
export declare function atomsCreateOneOff(client: Client, eventType: Pick<LinksEventTypeDto, "id" | "title" | "durationMinutes">, o: {
    timeZone: string;
    now?: number;
    maxSlots?: number;
    locale?: string;
}): Promise<{
    link: LinksDto;
    slots: string[];
}>;
/** The next confirmed bookings the signed-in user can see. Needs bookings:read. */
export declare function atomsUpcoming(client: Client, o?: {
    now?: number;
    limit?: number;
}): Promise<{
    id: string;
    startAt: string;
    invitee: string;
}[]>;
/** One line per meeting, in the reader's zone and language. */
export declare function atomsUpcomingText(items: readonly {
    startAt: string;
    invitee: string;
}[], o: {
    timeZone: string;
    locale?: string;
}): string;
/** API origins a user may configure: https, or http on localhost for development. Returns the normalized base URL or null. */
export declare function atomsParseApiUrl(input: string): string | null;
export declare const ATOMS_SHARE_SCOPES = "event_types:read event_types:write availability:read polls:read polls:write bookings:read";
export declare function atomsCreatePkce(): Promise<{
    verifier: string;
    challenge: string;
    state: string;
}>;
/** RFC 7591: each install registers itself as a public client for its own redirect address. */
export declare function atomsRegisterClient(apiUrl: string, name: string, redirectUri: string): Promise<string>;
/** The query of an authorization request. `{base}/oauth/authorize` on the API, or `{web}/oauth/consent` from a dialog that must stay on the web app's domain. */
export declare function atomsAuthorizeQuery(clientId: string, redirectUri: string, pkce: {
    challenge: string;
    state: string;
}): string;
/** The code from a redirect's query. Throws when the user said no or the state isn't ours. */
export declare function atomsCodeFromRedirect(search: string, state: string): string;
export interface AtomsTokens {
    accessToken: string;
    refreshToken: string;
    /** Epoch milliseconds. */
    expiresAt: number;
}
export declare function atomsExchangeCode(apiUrl: string, clientId: string, redirectUri: string, code: string, verifier: string, now?: number): Promise<AtomsTokens>;
/** Refresh tokens rotate, so the caller must save what this returns. Keeps a minute's margin. */
export declare function atomsFreshTokens(apiUrl: string, clientId: string, tokens: AtomsTokens, now?: number): Promise<AtomsTokens>;
export {};
