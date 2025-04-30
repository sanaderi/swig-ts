import { secp256k1 } from '@noble/curves/secp256k1';
import type { Connection, PublicKey } from '@solana/web3.js';
import type { Authority, SigningFn } from './authority';
import { fetchSwig } from './rpc';

export function getSigningFnForSecp256k1PrivateKey(
  privateKey: Uint8Array | string,
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


export class SwigSigner {
  constructor(
    public signerBytes: Uint8Array,
    public swigAddress: PublicKey,
    public connection: Connection,
    public payer?: PublicKey,
    public signingFn?: (message: Uint8Array) => Promise<Uint8Array> 
  ) {}

  async addAuthority(newAuthority: Authority) {
    let swig = await fetchSwig(this.connection, this.swigAddress)
    // let role = swig.findA
  }
}
