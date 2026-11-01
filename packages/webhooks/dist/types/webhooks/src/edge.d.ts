import { type SignatureHeader } from "./signature-header.js";
/** Same result as `verifySignature`, for any runtime with Web Crypto. `crypto.subtle.verify` compares in constant time. */
export declare function verifySignatureAsync(header: SignatureHeader, secret: string, body: string, nowSec: number, toleranceSec?: number): Promise<boolean>;
