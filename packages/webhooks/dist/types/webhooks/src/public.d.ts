import type { WebhookEventType } from "../../domain/src/index.js";
import { verifySignature } from "./sign.js";
import type { SignatureHeader } from "./signature-header.js";
export { verifySignature };
export type { SignatureHeader, WebhookEventType };
/** The JSON body of every delivery. Deduplicate on `id`: delivery is at least once. */
export interface WebhookEvent<Data = unknown> {
    id: string;
    type: WebhookEventType;
    createdAt: string;
    data: Data;
    version?: string;
    bookingId?: string | null;
    eventTypeId?: string | null;
}
export declare class WebhookSignatureError extends Error {
    constructor(message?: string);
}
/**
 * Verifies a delivery and parses it. Throws WebhookSignatureError unless the signature is valid and recent.
 * Pass the raw request body: reformatted JSON will not verify. Accepts the header from a framework as it arrives, even if missing.
 */
export declare function constructEvent<Data = unknown>(rawBody: string, header: SignatureHeader, secret: string, opts?: {
    nowSec?: number;
    toleranceSec?: number;
}): WebhookEvent<Data>;
