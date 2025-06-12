/**
 * Signing interface that takes a message and returns a signature of the signed message
 */
export type SigningFn = (message: Uint8Array) => Promise<SigningResult>;

/**
 * @property signature - Signature of the message
 * @property prefix - Additional Prefix added to the message
 */
export type SigningResult = { signature: Uint8Array; prefix?: Uint8Array };
