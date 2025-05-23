import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';
import { utf8ToBytes } from '@noble/hashes/utils';
import type { Connection, PublicKey } from '@solana/web3.js';
import type { Authority, SigningFn } from './authority';
import { getUnprefixedSecpBytes } from './utils';

/**
 * Get {@link SigningFn} for Secp268k1-based Private key
 * @param privateKey Secp256k1 Private key
 * @returns SigningFn
 */
export function getSigningFnForSecp256k1PrivateKey(
  privateKey: Uint8Array | string,
): SigningFn {
  return async (message: Uint8Array) => {
    const hash = keccak_256(message);
    let sig = secp256k1.sign(hash, getUnprefixedSecpBytes(privateKey, 32), {
      lowS: true,
    });

    let signature = new Uint8Array(65);
    signature.set(sig.toCompactRawBytes()); // 64-bytes
    signature.set(Uint8Array.from([sig.recovery + 27]), 64);

    return { signature };
  };
}

/**
 * Get `personal-sign` prefix for evm based wallets
 * @param messageLen Length of the message to be signed
 * @returns Prefix bytes
 */
export function getEvmPersonalSignPrefix(messageLen: number): Uint8Array {
  return utf8ToBytes(`\x19Ethereum Signed Message:\n${messageLen}`);
}

/**
 * this function does nothing. just implementing the interface of [SigningFn]
 */
export async function dummySigningFn(_: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(0);
}

class SwigSigner {
  constructor(
    public signerBytes: Uint8Array,
    public swigAddress: PublicKey,
    public connection: Connection,
    public payer?: PublicKey,
    public signingFn?: (message: Uint8Array) => Promise<Uint8Array>,
  ) {}

  async addAuthority(_newAuthority: Authority) {}
}
