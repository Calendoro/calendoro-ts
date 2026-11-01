/** Node hands a repeated header over as an array. */
export type SignatureHeader = string | readonly string[] | null | undefined;
/** Pulls the timestamp and signatures out of `t=<ts>,v1=<sig>,v1=<sig>`. Null when there is nothing usable: never throws on input from the network. */
export declare function parseSignatureHeader(header: SignatureHeader): {
    timestamp: number;
    signatures: string[];
} | null;
