import { secp256k1 } from '@noble/curves/secp256k1';
import type { SigningFn } from './authority';

export function getSigningFnForSecp256k1PrivateKey(
  privateKey: string,
): SigningFn {
  return async (message: Uint8Array) => {
    let sig = new Uint8Array(65);
    
    let _sig = secp256k1.sign(message, privateKey, { lowS: true });

    sig.set(_sig.toCompactRawBytes());
    sig.set(Uint8Array.from(_sig.recovery ? [0x1c] : [0x1b]), 64);

    return sig;
  };
}

/**
 * this function does nothing. just implementing the interface of [SigningFn]
 */
export async function dummySigningFn(_: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(0);
}
