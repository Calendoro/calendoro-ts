import type { OperationId, RouteInput, RouteOutput } from "../../contracts/src/index.js";
export * from "./errors.js";
export declare const SDK_VERSION = "0.1.0";
export interface ClientOptions {
    baseUrl: string;
    /** API key (`cdo_`) or OAuth access token. */
    token?: string;
    fetch?: typeof fetch;
    /** Attempts after the first, for network errors, 429, 502, 503 and 504 on requests safe to repeat. Default 2. */
    maxRetries?: number;
    /** Per attempt. Default 30 000. */
    timeoutMs?: number;
    /** First retry delay, doubling after that. Default 300. */
    retryBaseMs?: number;
    /**
     * Check responses yourself, such as with a schema. The default is no checking: a field or enum value the server adds later
     * must not break a client already in production. Throw to reject; the error is wrapped in ResponseValidationError.
     */
    validateResponse?: (operation: string, body: unknown) => unknown;
}
/** Every list takes `cursor` and `limit`, including those whose contract declares no query. */
type PageInput<Op extends OperationId> = RouteOutput<Op> extends {
    data: readonly unknown[];
} ? {
    query?: {
        cursor?: string;
        limit?: number;
    };
} : {};
export type ClientInput<Op extends OperationId> = RouteInput<Op> & PageInput<Op> & {
    headers?: Record<string, string>;
    signal?: AbortSignal;
};
export type Client = {
    [Op in OperationId]: (...args: {} extends RouteInput<Op> ? [input?: ClientInput<Op>] : [input: ClientInput<Op>]) => Promise<RouteOutput<Op>>;
};
/** One method per API operation. */
export declare function createClient(opts: ClientOptions): Client;
/** Operations returning `{ data: [...], nextCursor }`. */
export type ListOperation = {
    [Op in OperationId]: RouteOutput<Op> extends {
        data: readonly unknown[];
    } ? Op : never;
}[OperationId];
export type ListItem<Op extends ListOperation> = RouteOutput<Op> extends {
    data: readonly (infer T)[];
} ? T : never;
/**
 * Walks every page of a list, one item at a time, fetching more only as you go.
 * `for await (const b of paginate(api, "listBookings", { query: { status: "confirmed" } })) { ... }`
 */
export declare function paginate<Op extends ListOperation>(client: Client, op: Op, input?: ClientInput<Op>): AsyncGenerator<ListItem<Op>, void, undefined>;
