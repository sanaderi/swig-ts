import { hexToBytes } from '@noble/curves/abstract/utils';
import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';
import {
  Address,
  appendTransactionMessageInstructions,
  Commitment,
  createTransactionMessage,
  getProgramDerivedAddress,
  IAccountMeta,
  pipe,
  Rpc,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  TransactionSigner,
} from '@solana/kit';
import { SWIG_PROGRAM_ADDRESS } from './consts';

/**
 * Creates a SWIG Instruction with the swig program address
 */
export function swigInstruction<T extends IAccountMeta[]>(
  accounts: T,
  data: Uint8Array,
) {
  return {
    programAddress: SWIG_PROGRAM_ADDRESS,
    keys: accounts,
    data,
  };
}

export function uint8ArraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

export async function createLegacyTransaction(
  // TODO update this to use the new RPC interface instead of <any>
  rpc: Rpc<any>,
  instructions: any[], // your instruction objects
  feePayer: TransactionSigner,
  options?: { commitment?: Commitment },
) {
  const {
    value: { blockhash },
    // @ts-expect-error: rpc type is generic until Kit RPC is finalized
  } = await rpc.getLatestBlockhash(options).send();

  // Build the transaction message
  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(feePayer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
    (tx) => appendTransactionMessageInstructions(instructions, tx),
  );

  // Sign the transaction message (returns a signed transaction)
  const signedTransaction =
    await signTransactionMessageWithSigners(transactionMessage);

  return signedTransaction; // This is the Kit equivalent of a signed Transaction in web3.js
}

/**
 * Utility for deriving a Swig PDA (async)
 * @param id Swig ID
 * @returns Promise<[Address, number]> (address, bump)
 */
export async function findSwigPda(id: Uint8Array): Promise<[Address, number]> {
  // getProgramDerivedAddress returns a readonly tuple, so we cast via unknown to mutable
  return (await getProgramDerivedAddress({
    programAddress: SWIG_PROGRAM_ADDRESS,
    seeds: [Buffer.from('swig'), Buffer.from(id)],
  })) as unknown as [Address, number];
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
): Promise<[Address, number]> {
  const roleIdU32 = new Uint8Array(4);

  const view = new DataView(roleIdU32.buffer);
  view.setUint32(0, roleId, true);

  return (await getProgramDerivedAddress({
    programAddress: SWIG_PROGRAM_ADDRESS,
    seeds: [
      Buffer.from('sub-account'),
      Buffer.from(swigId),
      Buffer.from(roleIdU32),
    ],
  })) as unknown as [Address, number];
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
