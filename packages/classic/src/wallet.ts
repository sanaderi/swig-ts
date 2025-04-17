import * as ethers from 'ethers';
import type { SigningFn } from './authority';

export function getSigningFnForSecp256k1PrivateKey(
  privateKey: string,
): SigningFn {
  let wallet = new ethers.Wallet(privateKey);

  return async (message: Uint8Array) => {
    let messageStr = wallet.signingKey.sign(message).serialized;
    return Uint8Array.from(Buffer.from(messageStr.slice(2), 'hex'));
  };
}

/**
 * this function does nothing. just implementing the interface of [SigningFn]
 */
export async function dummySigningFn(_: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(0);
}
