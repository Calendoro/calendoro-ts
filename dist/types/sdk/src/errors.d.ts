/** Base of everything this SDK throws. */
export declare class CalendoroError extends Error {
    /** The `x-request-id` of the failed response. Quote it in support requests. */
    readonly requestId: string | undefined;
    constructor(message: string, requestId?: string, options?: ErrorOptions);
}
/** The API answered with an error status. `code` is stable; branch on it, not on the message. New codes can appear, so keep a default branch. */
export declare class ApiError extends CalendoroError {
    readonly status: number;
    readonly code: string;
    readonly details: unknown;
    constructor(status: number, code: string, message: string, details?: unknown, requestId?: string);
}
export declare class ValidationError extends ApiError {
}
export declare class AuthenticationError extends ApiError {
}
export declare class PermissionError extends ApiError {
}
export declare class NotFoundError extends ApiError {
}
export declare class ConflictError extends ApiError {
}
export declare class ServerError extends ApiError {
}
export declare class RateLimitError extends ApiError {
    /** Seconds the server asked to wait, when it said. */
    readonly retryAfter: number | undefined;
    constructor(status: number, code: string, message: string, details?: unknown, requestId?: string, retryAfter?: number);
}
/** The request never got an answer: DNS, connection or an aborted fetch. */
export declare class NetworkError extends CalendoroError {
}
/** No answer within `timeoutMs`. */
export declare class TimeoutError extends NetworkError {
}
/** `validateResponse` rejected a response. Only happens if you opt in to it. */
export declare class ResponseValidationError extends CalendoroError {
}
export declare function apiErrorFor(status: number, code: string, message: string, details: unknown, requestId: string | undefined, retryAfter: number | undefined): ApiError;
