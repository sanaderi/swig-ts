import { getAddressCodec } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';

export function uint8ArraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => {
    let passed = value === b[index];
    if (!passed)
      console.log('❌ not passed.', 'index:', index, 'value:', value);
    return passed;
  });
}

export function mockPublicKey(byte: number) {
  return new PublicKey(Uint8Array.from(Array(32).fill(byte)));
}

export function mockAddress(byte: number) {
  return getAddressCodec().decode(Uint8Array.from(Array(32).fill(byte)));
}

export function mockBytesArray(byte: number, length: number) {
  return Uint8Array.from(Array(length).fill(byte));
}
