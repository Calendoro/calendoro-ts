import { type SignatureHeader } from "./signature-header.js";
/** Hex HMAC-SHA256 of `${timestamp}.${body}`. */
export declare function signPayload(secret: string, timestamp: number, body: string): string;
/** "t=<ts>,v1=<sig1>,v1=<sig2>": one v1 per active secret, so receivers survive rotation. */
export declare function signatureHeader(secrets: string[], timestamp: number, body: string): string;
/** False, never a throw, for a missing or malformed header: this runs on whatever a stranger sends. */
export declare function verifySignature(header: SignatureHeader, secret: string, body: string, nowSec: number, toleranceSec?: number): boolean;
