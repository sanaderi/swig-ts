import { hexToBytes } from '@noble/curves/abstract/utils';
import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';
import { getProgramDerivedAddress } from '@solana/kit';
import { SWIG_PROGRAM_ADDRESS } from './consts';
import {
  SolanaInstructionContext,
  SolanaPublicKey,
  type SolanaAccountMeta,
} from './schema';

// /**
//  * Creates a SWIG Instruction with the swig program addresss
//  */
// export function swigInstruction<T extends SolanaAccountMeta[]>(
//   accounts: T,
//   data: Uint8Array,
// ): SolanaInstructionContext {
//   return new SolanaInstructionContext({
//     programId: new SolanaPublicKey(SWIG_PROGRAM_ADDRESS),
//     keys: accounts,
//     data,
//   });
// }

export function uint8ArraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

/**
 * Utility for deriving a Swig PDA (async)
 * @param id Swig ID
 * @returns Promise<[Address, number]> (address, bump)
 */
export async function findSwigPda(id: Uint8Array) {
  return await getProgramDerivedAddress({
    programAddress: SWIG_PROGRAM_ADDRESS,
    seeds: [Buffer.from('swig'), Buffer.from(id)],
  });
}

/**
 * Utility for deriving a Swig PDA (async)
 * @param id Swig ID
 * @returns Promise<[Address, number]> (address, bump)
 */
export async function findSwigPdaRaw(
  id: Uint8Array,
): Promise<[SolanaPublicKey, number]> {
  const [address, bump] = await findSwigPda(id);

  return [new SolanaPublicKey(address), bump];
}

/**
 * Utility for deriving a Swig SubAccount PDA (async)
 * @param swigId Swig ID
 * @param roleId number
 * @returns Promise<[Address, number]> (address, bump)
 */
export async function findSwigSubAccountPda(
  swigId: Uint8Array,
  roleId: number,
) {
  const roleIdU32 = new Uint8Array(4);

  const view = new DataView(roleIdU32.buffer);
  view.setUint32(0, roleId, true);

  return await getProgramDerivedAddress({
    programAddress: SWIG_PROGRAM_ADDRESS,
    seeds: [
      Buffer.from('sub-account'),
      Buffer.from(swigId),
      Buffer.from(roleIdU32),
    ],
  });
}

/**
 * Utility for deriving a Swig SubAccount PDA (async)
 * @param swigId Swig ID
 * @param roleId number
 * @returns Promise<[Address, number]> (address, bump)
 */
export async function findSwigSubAccountPdaRaw(
  swigId: Uint8Array,
  roleId: number,
): Promise<[SolanaPublicKey, number]> {
  const [address, bump] = await findSwigSubAccountPda(swigId, roleId);
  return [new SolanaPublicKey(address), bump];
}

export function compressedPubkeyToAddress(
  compressed: Uint8Array | string,
): Uint8Array {
  const compressedBytes = getUnprefixedSecpBytes(compressed, 33);

  const point = secp256k1.ProjectivePoint.fromHex(compressedBytes);

  const uncompressed = point.toRawBytes(false).slice(1);

  const hash = keccak_256(uncompressed);

  return hash.slice(12);
}

export function getUnprefixedSecpBytes(
  hexOrBytes: Uint8Array | string,
  length: 64 | 33 | 32 | 20,
): Uint8Array {
  const bytes =
    typeof hexOrBytes === 'string'
      ? hexToBytes(unprefixedHexString(hexOrBytes))
      : hexOrBytes;

  return bytes.length === length + 1 ? bytes.slice(1) : bytes;
}

export function unprefixedHexString(hex: string): string {
  return hex.startsWith('0x') ? hex.slice(2) : hex;
}

